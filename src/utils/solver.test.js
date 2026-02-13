    it('solves a puzzle requiring guessing (Backtracking)', () => {
        // A puzzle that logic alone cannot start usually has multiple solutions or requires a guess.
        // Example: The "domino" or "ambiguous" pattern, but we need a unique solution that requires lookahead.
        // Or just a very hard unique puzzle.
        // A simple case where line logic is stuck but global constraints solve it.
        // 
        // 0 1 1 0
        // 1 0 0 1
        // 1 0 0 1
        // 0 1 1 0
        // Hints:
        // R: 2, 1 1, 1 1, 2
        // C: 2, 1 1, 1 1, 2
        // This is a "ring". It might be solvable by logic if corners are forced.
        // Let's try a known "hard" small pattern.
        // 
        // 0 0 0
        // 0 1 0
        // 0 0 0
        // R: 0, 1, 0
        // C: 0, 1, 0
        // Logic solves this instantly.
        
        // Let's trust the logic works for general backtracking by forcing a guess.
        // We can mock solveLine to return "no change" to force backtracking? No, integration test is better.
        
        // Let's just ensure it returns a valid result structure for a solvable puzzle.
        const rowHints = [[1], [1], [1]];
        const colHints = [[1], [1], [1]];
        // 3x3 diagonal?
        // 1 0 0
        // 0 1 0
        // 0 0 1
        // Hints: 1, 1, 1
        // Cols: 1, 1, 1
        // This has multiple solutions (diagonal or anti-diagonal or others).
        // Our solver should find ONE of them and return 100%.
        
        const result = solvePuzzle(rowHints, colHints);
        expect(result.percentSolved).toBe(100);
        // It might use lookahead because logic can't decide.
        // Actually for this specific case, logic does nothing (all empty or all full are not possible, but many perms).
        // So it MUST branch.
        expect(result.maxDepth).toBeGreaterThan(0);
    });

    it('stress test: should solve 100 random valid 10x10 grids', () => {
        // This ensures the solver is robust and doesn't fail on valid puzzles.
        // Using a fixed seed or just running a loop.
        for (let i = 0; i < 100; i++) {
            const size = 10;
            const grid = generateRandomGrid(size, 0.5);
            const { rowHints, colHints } = calculateHints(grid);
            
            const result = solvePuzzle(rowHints, colHints);
            
            if (result.percentSolved < 100) {
                console.error('Failed Grid:', JSON.stringify(grid));
                console.error('Result:', result);
            }
            expect(result.percentSolved).toBe(100);
        }
    });
});
