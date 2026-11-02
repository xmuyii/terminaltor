-- Phase 1 Seed Migration: 20 Hand-Authored Challenges across Tiers 1–4
-- Every test case contains exact, hand-verified expected outputs.

INSERT INTO public.challenges (slug, title, description, tier, topic, starter_code, test_spec, evaluation_spec)
VALUES
-- TIER 1: ARITHMETIC (5 challenges)
(
    'sum_two',
    'Sum of two numbers',
    'Write a function that accepts two integers `a` and `b` and returns their sum.',
    1,
    'Arithmetic',
    'def solve(a: int, b: int) -> int:
    # Return the sum of a and b
    pass
',
    '[
        {"input": {"a": 3, "b": 4}, "expected": 7, "weight": 1},
        {"input": {"a": 0, "b": 0}, "expected": 0, "weight": 1},
        {"input": {"a": -5, "b": 12}, "expected": 7, "weight": 1},
        {"input": {"a": 100, "b": 250}, "expected": 350, "weight": 1},
        {"input": {"a": -20, "b": -30}, "expected": -50, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb
),
(
    'subtract',
    'Subtract numbers',
    'Write a function that accepts two numbers `a` and `b` and returns the result of `a - b`.',
    1,
    'Arithmetic',
    'def solve(a: int, b: int) -> int:
    # Return a minus b
    pass
',
    '[
        {"input": {"a": 10, "b": 4}, "expected": 6, "weight": 1},
        {"input": {"a": 5, "b": 15}, "expected": -10, "weight": 1},
        {"input": {"a": 0, "b": 0}, "expected": 0, "weight": 1},
        {"input": {"a": -3, "b": -7}, "expected": 4, "weight": 1},
        {"input": {"a": 100, "b": 55}, "expected": 45, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb
),
(
    'multiply',
    'Multiply two numbers',
    'Write a function that accepts two integers `a` and `b` and returns their product.',
    1,
    'Arithmetic',
    'def solve(a: int, b: int) -> int:
    # Return the product of a and b
    pass
',
    '[
        {"input": {"a": 6, "b": 7}, "expected": 42, "weight": 1},
        {"input": {"a": 0, "b": 99}, "expected": 0, "weight": 1},
        {"input": {"a": -4, "b": 5}, "expected": -20, "weight": 1},
        {"input": {"a": -8, "b": -8}, "expected": 64, "weight": 1},
        {"input": {"a": 12, "b": 12}, "expected": 144, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb
),
(
    'area_rectangle',
    'Area of a rectangle',
    'Write a function that computes the area of a rectangle given its `width` and `height`.',
    1,
    'Arithmetic',
    'def solve(width: int, height: int) -> int:
    # Compute width * height
    pass
',
    '[
        {"input": {"width": 5, "height": 8}, "expected": 40, "weight": 1},
        {"input": {"width": 10, "height": 10}, "expected": 100, "weight": 1},
        {"input": {"width": 3, "height": 7}, "expected": 21, "weight": 1},
        {"input": {"width": 1, "height": 99}, "expected": 99, "weight": 1},
        {"input": {"width": 12, "height": 6}, "expected": 72, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb
),
(
    'average_two',
    'Average of two numbers',
    'Write a function that calculates the arithmetic mean of two numbers `a` and `b`.',
    1,
    'Arithmetic',
    'def solve(a: float, b: float) -> float:
    # Compute average
    pass
',
    '[
        {"input": {"a": 4, "b": 6}, "expected": 5.0, "weight": 1},
        {"input": {"a": 10, "b": 20}, "expected": 15.0, "weight": 1},
        {"input": {"a": 3, "b": 4}, "expected": 3.5, "weight": 1},
        {"input": {"a": 0, "b": 0}, "expected": 0.0, "weight": 1},
        {"input": {"a": -10, "b": 10}, "expected": 0.0, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb
),

-- TIER 2: CONDITIONALS (5 challenges)
(
    'max_of_two',
    'Maximum of two numbers',
    'Write a function that accepts two numbers `a` and `b` and returns the greater number.',
    2,
    'Conditionals',
    'def solve(a: int, b: int) -> int:
    # Return whichever is larger
    pass
',
    '[
        {"input": {"a": 10, "b": 5}, "expected": 10, "weight": 1},
        {"input": {"a": 3, "b": 8}, "expected": 8, "weight": 1},
        {"input": {"a": 7, "b": 7}, "expected": 7, "weight": 1},
        {"input": {"a": -5, "b": -2}, "expected": -2, "weight": 1},
        {"input": {"a": 0, "b": -10}, "expected": 0, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb
),
(
    'is_even',
    'Check if number is even',
    'Write a function that returns True if the integer `n` is even, and False if it is odd.',
    2,
    'Conditionals',
    'def solve(n: int) -> bool:
    # Return True if even, else False
    pass
',
    '[
        {"input": {"n": 4}, "expected": true, "weight": 1},
        {"input": {"n": 7}, "expected": false, "weight": 1},
        {"input": {"n": 0}, "expected": true, "weight": 1},
        {"input": {"n": -2}, "expected": true, "weight": 1},
        {"input": {"n": 101}, "expected": false, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb
),
(
    'grade_letter',
    'Letter grade from score',
    'Return "A" for score >= 90, "B" for >= 80, "C" for >= 70, "D" for >= 60, otherwise "F".',
    2,
    'Conditionals',
    'def solve(score: int) -> str:
    # Return grade letter
    pass
',
    '[
        {"input": {"score": 95}, "expected": "A", "weight": 1},
        {"input": {"score": 82}, "expected": "B", "weight": 1},
        {"input": {"score": 75}, "expected": "C", "weight": 1},
        {"input": {"score": 61}, "expected": "D", "weight": 1},
        {"input": {"score": 45}, "expected": "F", "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb
),
(
    'absolute_value',
    'Absolute value',
    'Write a function that returns the non-negative magnitude of integer `n`.',
    2,
    'Conditionals',
    'def solve(n: int) -> int:
    # Return absolute value
    pass
',
    '[
        {"input": {"n": -15}, "expected": 15, "weight": 1},
        {"input": {"n": 20}, "expected": 20, "weight": 1},
        {"input": {"n": 0}, "expected": 0, "weight": 1},
        {"input": {"n": -1}, "expected": 1, "weight": 1},
        {"input": {"n": 999}, "expected": 999, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb
),
(
    'sign_of_number',
    'Sign of a number',
    'Return "positive" if n > 0, "negative" if n < 0, or "zero" if n == 0.',
    2,
    'Conditionals',
    'def solve(n: int) -> str:
    # Return "positive", "negative", or "zero"
    pass
',
    '[
        {"input": {"n": 42}, "expected": "positive", "weight": 1},
        {"input": {"n": -7}, "expected": "negative", "weight": 1},
        {"input": {"n": 0}, "expected": "zero", "weight": 1},
        {"input": {"n": 1}, "expected": "positive", "weight": 1},
        {"input": {"n": -99}, "expected": "negative", "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb
),

-- TIER 3: LOOPS (5 challenges)
(
    'sum_to_n',
    'Sum numbers up to n',
    'Calculate the sum of all positive integers from 1 up to and including `n`.',
    3,
    'Loops',
    'def solve(n: int) -> int:
    # Sum from 1 to n
    pass
',
    '[
        {"input": {"n": 5}, "expected": 15, "weight": 1},
        {"input": {"n": 1}, "expected": 1, "weight": 1},
        {"input": {"n": 10}, "expected": 55, "weight": 1},
        {"input": {"n": 3}, "expected": 6, "weight": 1},
        {"input": {"n": 100}, "expected": 5050, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb
),
(
    'count_evens',
    'Count even numbers up to n',
    'Count how many even integers exist between 1 and `n` (inclusive).',
    3,
    'Loops',
    'def solve(n: int) -> int:
    # Count evens from 1 to n
    pass
',
    '[
        {"input": {"n": 6}, "expected": 3, "weight": 1},
        {"input": {"n": 10}, "expected": 5, "weight": 1},
        {"input": {"n": 1}, "expected": 0, "weight": 1},
        {"input": {"n": 5}, "expected": 2, "weight": 1},
        {"input": {"n": 20}, "expected": 10, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb
),
(
    'factorial',
    'Calculate factorial',
    'Return `n!` (product of integers from 1 to n). Note that 0! equals 1.',
    3,
    'Loops',
    'def solve(n: int) -> int:
    # Return factorial of n
    pass
',
    '[
        {"input": {"n": 5}, "expected": 120, "weight": 1},
        {"input": {"n": 0}, "expected": 1, "weight": 1},
        {"input": {"n": 1}, "expected": 1, "weight": 1},
        {"input": {"n": 4}, "expected": 24, "weight": 1},
        {"input": {"n": 6}, "expected": 720, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb
),
(
    'power_loop',
    'Power calculation',
    'Compute `base` raised to the power of `exp` (where exp >= 0).',
    3,
    'Loops',
    'def solve(base: int, exp: int) -> int:
    # Return base raised to exp
    pass
',
    '[
        {"input": {"base": 2, "exp": 3}, "expected": 8, "weight": 1},
        {"input": {"base": 5, "exp": 0}, "expected": 1, "weight": 1},
        {"input": {"base": 3, "exp": 4}, "expected": 81, "weight": 1},
        {"input": {"base": 10, "exp": 2}, "expected": 100, "weight": 1},
        {"input": {"base": 4, "exp": 2}, "expected": 16, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb
),
(
    'fizzbuzz_basic',
    'FizzBuzz check',
    'Return "FizzBuzz" if divisible by 15, "Fizz" if by 3, "Buzz" if by 5, else string of n.',
    3,
    'Loops',
    'def solve(n: int) -> str:
    # Return Fizz, Buzz, FizzBuzz or str(n)
    pass
',
    '[
        {"input": {"n": 15}, "expected": "FizzBuzz", "weight": 1},
        {"input": {"n": 9}, "expected": "Fizz", "weight": 1},
        {"input": {"n": 10}, "expected": "Buzz", "weight": 1},
        {"input": {"n": 7}, "expected": "7", "weight": 1},
        {"input": {"n": 30}, "expected": "FizzBuzz", "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb
),

-- TIER 4: LISTS (5 challenges)
(
    'max_in_list',
    'Find maximum in a list',
    'Write a function that finds and returns the largest number in a list of numbers.',
    4,
    'Lists',
    'def solve(numbers: list[int]) -> int:
    # Return maximum element
    pass
',
    '[
        {"input": {"numbers": [1, 5, 3, 9, 2]}, "expected": 9, "weight": 1},
        {"input": {"numbers": [-10, -5, -20]}, "expected": -5, "weight": 1},
        {"input": {"numbers": [42]}, "expected": 42, "weight": 1},
        {"input": {"numbers": [0, 0, 0]}, "expected": 0, "weight": 1},
        {"input": {"numbers": [100, 200, 50]}, "expected": 200, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb
),
(
    'sum_list',
    'Sum all list elements',
    'Write a function that calculates and returns the sum of all numbers in a list.',
    4,
    'Lists',
    'def solve(numbers: list[int]) -> int:
    # Return sum of numbers
    pass
',
    '[
        {"input": {"numbers": [1, 2, 3, 4, 5]}, "expected": 15, "weight": 1},
        {"input": {"numbers": []}, "expected": 0, "weight": 1},
        {"input": {"numbers": [-5, 5, -10, 10]}, "expected": 0, "weight": 1},
        {"input": {"numbers": [100, 250]}, "expected": 350, "weight": 1},
        {"input": {"numbers": [7]}, "expected": 7, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb
),
(
    'reverse_list',
    'Reverse a list',
    'Write a function that returns a new list containing elements in reverse order.',
    4,
    'Lists',
    'def solve(items: list) -> list:
    # Return reversed items
    pass
',
    '[
        {"input": {"items": [1, 2, 3]}, "expected": [3, 2, 1], "weight": 1},
        {"input": {"items": ["a", "b", "c"]}, "expected": ["c", "b", "a"], "weight": 1},
        {"input": {"items": []}, "expected": [], "weight": 1},
        {"input": {"items": [42]}, "expected": [42], "weight": 1},
        {"input": {"items": [10, 20, 30, 40]}, "expected": [40, 30, 20, 10], "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb
),
(
    'count_item',
    'Count occurrences in list',
    'Write a function that counts how many times `target` appears in list `items`.',
    4,
    'Lists',
    'def solve(items: list, target) -> int:
    # Return count of target in items
    pass
',
    '[
        {"input": {"items": [1, 2, 2, 3, 2], "target": 2}, "expected": 3, "weight": 1},
        {"input": {"items": ["a", "b", "c"], "target": "z"}, "expected": 0, "weight": 1},
        {"input": {"items": [5, 5, 5, 5], "target": 5}, "expected": 4, "weight": 1},
        {"input": {"items": [], "target": 1}, "expected": 0, "weight": 1},
        {"input": {"items": [true, false, true], "target": true}, "expected": 2, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb
),
(
    'find_index',
    'Find element index in list',
    'Return the zero-based index of the first occurrence of `target` in `items`, or -1 if not found.',
    4,
    'Lists',
    'def solve(items: list, target) -> int:
    # Return index or -1
    pass
',
    '[
        {"input": {"items": [10, 20, 30, 40], "target": 30}, "expected": 2, "weight": 1},
        {"input": {"items": ["cat", "dog", "bird"], "target": "cat"}, "expected": 0, "weight": 1},
        {"input": {"items": [1, 2, 3], "target": 99}, "expected": -1, "weight": 1},
        {"input": {"items": [], "target": 5}, "expected": -1, "weight": 1},
        {"input": {"items": [7, 8, 9, 10], "target": 10}, "expected": 3, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb
)
ON CONFLICT (slug) DO UPDATE
SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    tier = EXCLUDED.tier,
    topic = EXCLUDED.topic,
    starter_code = EXCLUDED.starter_code,
    test_spec = EXCLUDED.test_spec,
    evaluation_spec = EXCLUDED.evaluation_spec;
