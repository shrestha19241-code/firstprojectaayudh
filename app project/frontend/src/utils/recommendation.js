export function getRecommendedOffer(offers) {
  if (!offers || offers.length === 0) {
    return null
  }

  return [...offers].sort((a, b) => {
    const scoreA =
      Number(a.reliability_score) * 10 -
      Number(a.delivery_days) * 2 -
      Number(a.price_per_unit) * 0.01

    const scoreB =
      Number(b.reliability_score) * 10 -
      Number(b.delivery_days) * 2 -
      Number(b.price_per_unit) * 0.01

    return scoreB - scoreA
  })[0]
}
