import { describe, it, expect } from 'vitest'
import { calculateHints } from './puzzleUtils'

describe('puzzleUtils', () => {
  it('calculateHints correctly calculates hints for a simple grid', () => {
    const grid = [
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 0]
    ]
    // Row 0: 1, then space, then 1 -> [1, 1]
    // Row 1: 1, 1, 1 -> [3]
    // Row 2: space, 1, space -> [1]
    
    // Col 0: 1, 1, 0 -> [2]
    // Col 1: 0, 1, 1 -> [2] ? Wait. Col 1 is 0, 1, 1. So space, 1, 1 -> [2].
    // Let's trace col 1 manually:
    // r0,c1 = 0
    // r1,c1 = 1 -> count=1
    // r2,c1 = 1 -> count=2
    // end -> push 2.
    // So Col 1 is [2].
    
    // Wait, my manual trace above for col 1:
    // grid[0][1] is 0.
    // grid[1][1] is 1.
    // grid[2][1] is 1.
    // Yes, [2].
    
    // Col 2: 1, 1, 0 -> [2].
    
    const expected = {
      rowHints: [[1, 1], [3], [1]],
      colHints: [[2], [2], [2]]
    }
    expect(calculateHints(grid)).toEqual(expected)
  })

  it('calculateHints handles empty rows/cols', () => {
    const grid = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ]
    const expected = {
      rowHints: [[0], [0], [0]],
      colHints: [[0], [0], [0]]
    }
    expect(calculateHints(grid)).toEqual(expected)
  })
})
