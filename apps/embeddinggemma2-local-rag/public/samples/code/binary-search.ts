export function binarySearch(nums: number[], target: number): number {
  let lo = 0
  let hi = nums.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const value = nums[mid]
    if (value === target) return mid
    if (value !== undefined && value < target) lo = mid + 1
    else hi = mid - 1
  }
  return -1
}
