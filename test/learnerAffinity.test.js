const test = require("node:test");
const assert = require("node:assert/strict");
const LearnerAffinity = require("../src/models/learnerAffinity.model");
const Tutor = require("../src/models/tutor.model");
const learnerAffinityRepository = require("../src/repositories/learnerAffinity.repository");
const tutorRepository = require("../src/repositories/tutor.repository");
const learnerAffinityService = require("../src/services/learnerAffinity.service");
const tutorService = require("../src/services/tutor.service");
const locationCache = require("../src/utils/locationCache");

// Thay tạm thuộc tính của object, trả hàm khôi phục
const stub = (obj, fns) => {
  const originals = Object.fromEntries(Object.keys(fns).map((k) => [k, obj[k]]));
  Object.assign(obj, fns);
  return () => Object.assign(obj, originals);
};

// Model giả: lưu 1 document trong RAM, mô phỏng $ne trên countedClassIds + unique userId
const fakeStore = (initial = null) => {
  const state = { doc: initial };
  const restore = stub(LearnerAffinity, {
    findOne: () => ({ lean: async () => state.doc }),
    updateOne: async (filter, update) => {
      const ne = filter.countedClassIds?.$ne;
      if (state.doc && ne && state.doc.countedClassIds.some((id) => String(id) === String(ne))) {
        throw Object.assign(new Error("dup"), { code: 11000 });
      }
      const counted = state.doc?.countedClassIds || [];
      const add = update.$addToSet?.countedClassIds;
      state.doc = { contexts: update.$set.contexts, countedClassIds: add ? [...counted, add] : counted };
    },
  });
  return { state, restore };
};

test("khóa môn|tỉnh: tách ngược đúng, chặn khóa không lưu được", () => {
  const { contextKey, parseContextKey } = learnerAffinityService;
  assert.equal(contextKey("Toán", 79), "Toán|79");
  assert.equal(contextKey("Toán", undefined), "Toán|");
  assert.equal(contextKey("", 1), "|1");
  assert.equal(contextKey("", undefined), null);
  assert.equal(contextKey("Tin.học", 1), null);
  assert.equal(contextKey("$where", 1), null);
  assert.deepEqual(parseContextKey("Toán|79"), { subject: "Toán", province: 79 });
  assert.deepEqual(parseContextKey("|1"), { subject: null, province: 1 });
  assert.deepEqual(parseContextKey("Toán|"), { subject: "Toán", province: null });
});

test("bump: cùng khóa trong 60s không cộng lại, quá 60s thì cộng", async () => {
  const { state, restore } = fakeStore();
  try {
    const t0 = 1_000_000_000;
    assert.equal(await learnerAffinityRepository.bump("u1", "Toán|79", 2, { throttleMs: 60_000 }, t0), true);
    assert.equal(await learnerAffinityRepository.bump("u1", "Toán|79", 2, { throttleMs: 60_000 }, t0 + 30_000), false);
    assert.equal(await learnerAffinityRepository.bump("u1", "Toán|79", 2, { throttleMs: 60_000 }, t0 + 61_000), true);
    assert.ok(state.doc.contexts["Toán|79"].s > 3.99 && state.doc.contexts["Toán|79"].s <= 4);
  } finally {
    restore();
  }
});

test("bump: mỗi lớp chỉ cộng 1 lần, kể cả khi document đã có lớp đó", async () => {
  const { state, restore } = fakeStore();
  try {
    assert.equal(await learnerAffinityRepository.bump("u1", "Toán|79", 5, { classId: "c1" }), true);
    assert.equal(await learnerAffinityRepository.bump("u1", "Toán|79", 5, { classId: "c1" }), false);
    assert.equal(Math.round(state.doc.contexts["Toán|79"].s), 5);
    assert.deepEqual(state.doc.countedClassIds, ["c1"]);
  } finally {
    restore();
  }
});

test("bump: giữ tối đa 20 khóa điểm cao nhất", async () => {
  const now = Date.now();
  const contexts = Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [`M${i}|1`, { s: 1 + i, t: now }])
  );
  const { state, restore } = fakeStore({ contexts, countedClassIds: [] });
  try {
    await learnerAffinityRepository.bump("u1", "Mới|2", 5, {}, now);
    const keys = Object.keys(state.doc.contexts);
    assert.equal(keys.length, 20);
    assert.ok(keys.includes("Mới|2"));
    assert.ok(!keys.includes("M0|1")); // điểm thấp nhất bị bỏ
  } finally {
    restore();
  }
});

test("getRankingContexts: chỉ học viên; lỗi đọc thì về thứ tự chung", async () => {
  const restoreRepo = stub(learnerAffinityRepository, {
    findDecayedContexts: async () => ({ "Toán|79": 5 }),
  });
  try {
    assert.deepEqual(await learnerAffinityService.getRankingContexts(null), []);
    assert.deepEqual(await learnerAffinityService.getRankingContexts({ id: "u1", role: "tutor" }), []);
    assert.deepEqual(await learnerAffinityService.getRankingContexts({ id: "u1", role: "user" }), [
      { subject: "Toán", province: 79, score: 5 },
    ]);

    learnerAffinityRepository.findDecayedContexts = async () => {
      throw new Error("db down");
    };
    assert.deepEqual(await learnerAffinityService.getRankingContexts({ id: "u1", role: "user" }), []);
  } finally {
    restoreRepo();
  }
});

test("searchTutors: có ngữ cảnh thì xếp _affinity trước khi phân trang, không có thì giữ thứ tự cũ", async () => {
  let pipeline;
  const restore = stub(Tutor, {
    aggregate: async (p) => {
      pipeline = p;
      return [{ items: [], total: [] }];
    },
  });
  try {
    await tutorRepository.searchTutors({ subject: "Toán" }, 1, 20);
    const items = pipeline.at(-1).$facet.items;
    assert.equal(Object.keys(items[0].$sort)[0], "_reviewCount");

    await tutorRepository.searchTutors({ subject: "Toán" }, 2, 20, {
      affinity: [{ subject: "Toán", province: 79, score: 5 }],
    });
    // Bộ lọc vẫn nằm trong $match đầu tiên, cá nhân hóa chỉ đổi thứ tự
    assert.ok(pipeline[0].$match.subjects);
    const ranked = pipeline.at(-1).$facet.items;
    assert.equal(Object.keys(ranked[0].$sort)[0], "_affinity");
    assert.deepEqual(ranked[1], { $skip: 20 });
    const expr = pipeline.at(-2).$addFields._affinity;
    assert.deepEqual(expr.$add[0].$cond[0].$and[0].$in[0], { $literal: "Toán" });
  } finally {
    restore();
  }
});

test("API danh sách gia sư công khai không trả SĐT/email, vẫn giữ ngày sinh", async () => {
  const dob = new Date("2000-01-01");
  const tutorDoc = {
    _id: "t1",
    userId: { _id: "u1", fullName: "A", email: "a@x.vn", dateOfBirth: dob },
    phone: "0912345678",
    subjects: ["Toán"],
  };
  const restoreRepo = stub(tutorRepository, {
    searchTutors: async () => ({ tutors: [tutorDoc], total: 1, page: 1, limit: 20 }),
    findTopTutors: async () => [tutorDoc],
    findTrustedTutorIds: async () => [],
  });
  const restoreCache = stub(locationCache, { ensureLoaded: async () => {} });
  try {
    const { tutors } = await tutorService.searchActiveTutors({}, 1, 20, null);
    const top = await tutorService.getTopTutors(10);
    for (const dto of [tutors[0], top[0]]) {
      assert.equal("phone" in dto, false);
      assert.equal("email" in dto, false);
      assert.equal(dto.dateOfBirth, dob);
    }
  } finally {
    restoreRepo();
    restoreCache();
  }
});
