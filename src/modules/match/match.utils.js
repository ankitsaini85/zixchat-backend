export function calculateCompatibility(answersA, answersB) {
  let totalScore = 0;
  let totalWeight = 0;

  answersA.forEach((a) => {
    const b = answersB.find(x => x.questionId.equals(a.questionId));
    if (!b) return;

    const diff = Math.abs(a.answer - b.answer); // 0–4
    const similarity = 1 - diff / 4;            // 0–1

    const weight = 1; // later configurable
    totalScore += similarity * weight;
    totalWeight += weight;
  });

  if (totalWeight === 0) return 0;

  return Math.round((totalScore / totalWeight) * 100);
}
