import { describe, expect, test } from "bun:test"
import { projectTo2D } from "./pca"
import { cosineSimilarity, l2Normalize } from "./similarity"

describe("cosineSimilarity", () => {
  test("identical unit vectors score 1", () => {
    const a = l2Normalize(new Float32Array([1, 2, 3, 4]))
    expect(cosineSimilarity(a, a)).toBeCloseTo(1, 5)
  })

  test("orthogonal vectors score ~0", () => {
    const a = new Float32Array([1, 0, 0])
    const b = new Float32Array([0, 1, 0])
    expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5)
  })

  test("refuses mixed dimensions", () => {
    expect(() =>
      cosineSimilarity(new Float32Array([1, 0]), new Float32Array([1, 0, 0])),
    ).toThrow()
  })
})

describe("projectTo2D", () => {
  test("places two distant points apart", () => {
    const a = new Float32Array([1, 0, 0, 0])
    const b = new Float32Array([0, 1, 0, 0])
    const points = projectTo2D([
      { id: "a", title: "a", embedding: a, modality: "text" },
      { id: "b", title: "b", embedding: b, modality: "image" },
    ])
    expect(points).toHaveLength(2)
    const dx = (points[0]?.x ?? 0) - (points[1]?.x ?? 0)
    const dy = (points[0]?.y ?? 0) - (points[1]?.y ?? 0)
    expect(Math.hypot(dx, dy)).toBeGreaterThan(0.4)
  })
})
