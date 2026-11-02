-- Phase 3 Seed Migration: 40 Hand-Authored Challenges across Tiers 5–8
-- Every test case contains exact, hand-verified expected outputs.

INSERT INTO public.challenges (slug, title, description, tier, topic, starter_code, test_spec, evaluation_spec, xp_reward)
VALUES
-- ============================================================================
-- TIER 5: DATA STRUCTURES & ADVANCED LISTS (10 challenges, 35 XP each)
-- ============================================================================
(
    'flatten_nested_list',
    'Flatten Nested List',
    'Write a function `solve(nested)` that flattens a 2D list of integers into a single 1D list.',
    5,
    'Data Structures',
    'def solve(nested: list[list[int]]) -> list[int]:
    # Flatten 2D list into 1D
    pass
',
    '[
        {"input": {"nested": [[1, 2], [3, 4], [5]]}, "expected": [1, 2, 3, 4, 5], "weight": 1},
        {"input": {"nested": []}, "expected": [], "weight": 1},
        {"input": {"nested": [[10], [], [20, 30]]}, "expected": [10, 20, 30], "weight": 1},
        {"input": {"nested": [[1, 1], [1, 1]]}, "expected": [1, 1, 1, 1], "weight": 1},
        {"input": {"nested": [[99]]}, "expected": [99], "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    35
),
(
    'rotate_array_k',
    'Rotate Array by K',
    'Write a function `solve(arr, k)` that rotates an array to the right by `k` positions.',
    5,
    'Data Structures',
    'def solve(arr: list[int], k: int) -> list[int]:
    # Rotate array right by k
    pass
',
    '[
        {"input": {"arr": [1, 2, 3, 4, 5], "k": 2}, "expected": [4, 5, 1, 2, 3], "weight": 1},
        {"input": {"arr": [1, 2, 3], "k": 0}, "expected": [1, 2, 3], "weight": 1},
        {"input": {"arr": [1, 2, 3], "k": 3}, "expected": [1, 2, 3], "weight": 1},
        {"input": {"arr": [10, 20], "k": 5}, "expected": [20, 10], "weight": 1},
        {"input": {"arr": [], "k": 4}, "expected": [], "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb,
    35
),
(
    'chunk_list',
    'Chunk a List',
    'Write a function `solve(arr, size)` that splits a list into sublists of length `size`. The final chunk may be shorter.',
    5,
    'Data Structures',
    'def solve(arr: list[int], size: int) -> list[list[int]]:
    # Chunk list into sublists of size
    pass
',
    '[
        {"input": {"arr": [1, 2, 3, 4, 5], "size": 2}, "expected": [[1, 2], [3, 4], [5]], "weight": 1},
        {"input": {"arr": [1, 2, 3, 4], "size": 2}, "expected": [[1, 2], [3, 4]], "weight": 1},
        {"input": {"arr": [1, 2, 3], "size": 5}, "expected": [[1, 2, 3]], "weight": 1},
        {"input": {"arr": [], "size": 3}, "expected": [], "weight": 1},
        {"input": {"arr": [10, 20, 30], "size": 1}, "expected": [[10], [20], [30]], "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb,
    35
),
(
    'unique_in_order',
    'Unique in Order',
    'Write a function `solve(sequence)` that returns a list of items without any elements with the same value next to each other, preserving order.',
    5,
    'Data Structures',
    'def solve(sequence: list) -> list:
    # Remove consecutive duplicates
    pass
',
    '[
        {"input": {"sequence": [1, 2, 2, 3, 3, 3, 4]}, "expected": [1, 2, 3, 4], "weight": 1},
        {"input": {"sequence": [1, 1, 1, 1]}, "expected": [1], "weight": 1},
        {"input": {"sequence": []}, "expected": [], "weight": 1},
        {"input": {"sequence": [1, 2, 1, 2]}, "expected": [1, 2, 1, 2], "weight": 1},
        {"input": {"sequence": [5, 4, 4, 2, 2, 1]}, "expected": [5, 4, 2, 1], "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    35
),
(
    'interleave_lists',
    'Interleave Two Lists',
    'Write a function `solve(a, b)` that alternates elements from two lists of equal length.',
    5,
    'Data Structures',
    'def solve(a: list, b: list) -> list:
    # Interleave a and b
    pass
',
    '[
        {"input": {"a": [1, 3, 5], "b": [2, 4, 6]}, "expected": [1, 2, 3, 4, 5, 6], "weight": 1},
        {"input": {"a": [], "b": []}, "expected": [], "weight": 1},
        {"input": {"a": [10], "b": [20]}, "expected": [10, 20], "weight": 1},
        {"input": {"a": [1, 1], "b": [2, 2]}, "expected": [1, 2, 1, 2], "weight": 1},
        {"input": {"a": [9, 8, 7], "b": [1, 2, 3]}, "expected": [9, 1, 8, 2, 7, 3], "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb,
    35
),
(
    'cumulative_sum',
    'Cumulative Sum',
    'Write a function `solve(nums)` that returns the running cumulative sum list.',
    5,
    'Data Structures',
    'def solve(nums: list[int]) -> list[int]:
    # Return cumulative sums
    pass
',
    '[
        {"input": {"nums": [1, 2, 3, 4]}, "expected": [1, 3, 6, 10], "weight": 1},
        {"input": {"nums": []}, "expected": [], "weight": 1},
        {"input": {"nums": [5]}, "expected": [5], "weight": 1},
        {"input": {"nums": [1, -1, 1, -1]}, "expected": [1, 0, 1, 0], "weight": 1},
        {"input": {"nums": [10, 20, 30]}, "expected": [10, 30, 60], "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    35
),
(
    'pairwise_difference',
    'Pairwise Differences',
    'Write a function `solve(nums)` that returns a list of absolute differences between consecutive pairs.',
    5,
    'Data Structures',
    'def solve(nums: list[int]) -> list[int]:
    # Absolute differences between consecutive items
    pass
',
    '[
        {"input": {"nums": [1, 5, 3, 9]}, "expected": [4, 2, 6], "weight": 1},
        {"input": {"nums": [10, 10, 10]}, "expected": [0, 0], "weight": 1},
        {"input": {"nums": [1, 2]}, "expected": [1], "weight": 1},
        {"input": {"nums": [1]}, "expected": [], "weight": 1},
        {"input": {"nums": [20, 5, 12]}, "expected": [15, 7], "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    35
),
(
    'matrix_transpose',
    'Matrix Transpose',
    'Write a function `solve(matrix)` that computes the transpose of a 2D matrix (swapping rows and columns).',
    5,
    'Data Structures',
    'def solve(matrix: list[list[int]]) -> list[list[int]]:
    # Transpose matrix
    pass
',
    '[
        {"input": {"matrix": [[1, 2], [3, 4]]}, "expected": [[1, 3], [2, 4]], "weight": 1},
        {"input": {"matrix": [[1, 2, 3], [4, 5, 6]]}, "expected": [[1, 4], [2, 5], [3, 6]], "weight": 1},
        {"input": {"matrix": []}, "expected": [], "weight": 1},
        {"input": {"matrix": [[7]]}, "expected": [[7]], "weight": 1},
        {"input": {"matrix": [[1], [2], [3]]}, "expected": [[1, 2, 3]], "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    35
),
(
    'find_peaks',
    'Find Array Peaks',
    'Write a function `solve(arr)` that returns the indices of all peak elements (strictly greater than adjacent neighbors). Elements on the boundaries are never peaks.',
    5,
    'Data Structures',
    'def solve(arr: list[int]) -> list[int]:
    # Return indices of strictly greater peak elements
    pass
',
    '[
        {"input": {"arr": [1, 3, 2, 5, 4]}, "expected": [1, 3], "weight": 1},
        {"input": {"arr": [1, 2, 3, 4, 5]}, "expected": [], "weight": 1},
        {"input": {"arr": [5, 4, 3, 2, 1]}, "expected": [], "weight": 1},
        {"input": {"arr": [3, 2, 3, 6, 4, 1]}, "expected": [3], "weight": 1},
        {"input": {"arr": [1, 2, 1]}, "expected": [1], "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    35
),
(
    'longest_consecutive_zeros',
    'Longest Consecutive Zeros',
    'Write a function `solve(nums)` that returns the maximum count of contiguous zeros in a list of integers.',
    5,
    'Data Structures',
    'def solve(nums: list[int]) -> int:
    # Max contiguous zeros
    pass
',
    '[
        {"input": {"nums": [1, 0, 0, 1, 0, 0, 0, 1]}, "expected": 3, "weight": 1},
        {"input": {"nums": [1, 1, 1]}, "expected": 0, "weight": 1},
        {"input": {"nums": [0, 0, 0, 0]}, "expected": 4, "weight": 1},
        {"input": {"nums": []}, "expected": 0, "weight": 1},
        {"input": {"nums": [0, 1, 0]}, "expected": 1, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    35
),

-- ============================================================================
-- TIER 6: STRINGS & TEXT PARSING (10 challenges, 45 XP each)
-- ============================================================================
(
    'camel_to_snake',
    'Camel to Snake Case',
    'Write a function `solve(s)` that converts a camelCase string into snake_case.',
    6,
    'Strings & Parsing',
    'def solve(s: str) -> str:
    # Convert camelCase to snake_case
    pass
',
    '[
        {"input": {"s": "camelCase"}, "expected": "camel_case", "weight": 1},
        {"input": {"s": "sovereignAcademy"}, "expected": "sovereign_academy", "weight": 1},
        {"input": {"s": "hello"}, "expected": "hello", "weight": 1},
        {"input": {"s": ""}, "expected": "", "weight": 1},
        {"input": {"s": "myVariableName"}, "expected": "my_variable_name", "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    45
),
(
    'count_vowels_consonants',
    'Count Vowels and Consonants',
    'Write a function `solve(text)` that returns a dict `{"vowels": v, "consonants": c}` for ASCII letters in `text` (case-insensitive). Ignore digits and spaces.',
    6,
    'Strings & Parsing',
    'def solve(text: str) -> dict:
    # Return count of vowels and consonants
    pass
',
    '[
        {"input": {"text": "hello"}, "expected": {"vowels": 2, "consonants": 3}, "weight": 1},
        {"input": {"text": "Python 3.11"}, "expected": {"vowels": 1, "consonants": 5}, "weight": 1},
        {"input": {"text": ""}, "expected": {"vowels": 0, "consonants": 0}, "weight": 1},
        {"input": {"text": "AEIOU"}, "expected": {"vowels": 5, "consonants": 0}, "weight": 1},
        {"input": {"text": "rhythm"}, "expected": {"vowels": 0, "consonants": 6}, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    45
),
(
    'is_anagram',
    'Check Anagram',
    'Write a function `solve(s1, s2)` that checks if two strings are anagrams of each other (ignoring case and whitespace).',
    6,
    'Strings & Parsing',
    'def solve(s1: str, s2: str) -> bool:
    # Check if s1 and s2 are anagrams
    pass
',
    '[
        {"input": {"s1": "listen", "s2": "silent"}, "expected": true, "weight": 1},
        {"input": {"s1": "Astronomer", "s2": "Moon starer"}, "expected": true, "weight": 1},
        {"input": {"s1": "hello", "s2": "world"}, "expected": false, "weight": 1},
        {"input": {"s1": "rat", "s2": "car"}, "expected": false, "weight": 1},
        {"input": {"s1": "a", "s2": "A"}, "expected": true, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb,
    45
),
(
    'truncate_words',
    'Truncate by Words',
    'Write a function `solve(text, max_words)` that truncates `text` to `max_words` words, appending "..." only if truncated.',
    6,
    'Strings & Parsing',
    'def solve(text: str, max_words: int) -> str:
    # Truncate text to max_words
    pass
',
    '[
        {"input": {"text": "The quick brown fox jumps over the lazy dog", "max_words": 4}, "expected": "The quick brown fox...", "weight": 1},
        {"input": {"text": "Hello world", "max_words": 2}, "expected": "Hello world", "weight": 1},
        {"input": {"text": "Hello world", "max_words": 5}, "expected": "Hello world", "weight": 1},
        {"input": {"text": "One", "max_words": 1}, "expected": "One", "weight": 1},
        {"input": {"text": "", "max_words": 3}, "expected": "", "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb,
    45
),
(
    'caesar_cipher',
    'Caesar Cipher',
    'Write a function `solve(text, shift)` that shifts lowercase ASCII letters by `shift` positions. Other characters remain unchanged.',
    6,
    'Strings & Parsing',
    'def solve(text: str, shift: int) -> str:
    # Caesar shift lowercase letters
    pass
',
    '[
        {"input": {"text": "abc", "shift": 3}, "expected": "def", "weight": 1},
        {"input": {"text": "xyz", "shift": 2}, "expected": "zab", "weight": 1},
        {"input": {"text": "hello, world!", "shift": 13}, "expected": "uryyb, jbeyq!", "weight": 1},
        {"input": {"text": "abc", "shift": 26}, "expected": "abc", "weight": 1},
        {"input": {"text": "", "shift": 5}, "expected": "", "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb,
    45
),
(
    'valid_ipv4',
    'Validate IPv4 Address',
    'Write a function `solve(ip)` that returns `True` if `ip` is a valid IPv4 address (4 octets 0-255, no leading zeroes like 01), else `False`.',
    6,
    'Strings & Parsing',
    'def solve(ip: str) -> bool:
    # Check valid IPv4
    pass
',
    '[
        {"input": {"ip": "192.168.1.1"}, "expected": true, "weight": 1},
        {"input": {"ip": "255.255.255.255"}, "expected": true, "weight": 1},
        {"input": {"ip": "256.100.0.1"}, "expected": false, "weight": 1},
        {"input": {"ip": "192.168.01.1"}, "expected": false, "weight": 1},
        {"input": {"ip": "1.2.3"}, "expected": false, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    45
),
(
    'compress_consecutive',
    'Compress Consecutive Characters',
    'Write a function `solve(s)` that compresses consecutive characters: "aaabbc" -> "a3b2c1". Empty string returns "".',
    6,
    'Strings & Parsing',
    'def solve(s: str) -> str:
    # Run length encoding string
    pass
',
    '[
        {"input": {"s": "aaabbc"}, "expected": "a3b2c1", "weight": 1},
        {"input": {"s": "a"}, "expected": "a1", "weight": 1},
        {"input": {"s": ""}, "expected": "", "weight": 1},
        {"input": {"s": "aabbbcccc"}, "expected": "a2b3c4", "weight": 1},
        {"input": {"s": "zz"}, "expected": "z2", "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    45
),
(
    'extract_domain',
    'Extract Domain Name',
    'Write a function `solve(url)` that extracts the domain name from a URL (e.g. "https://www.google.com/search" -> "google.com", "http://github.com" -> "github.com").',
    6,
    'Strings & Parsing',
    'def solve(url: str) -> str:
    # Extract domain from url
    pass
',
    '[
        {"input": {"url": "https://www.google.com/search"}, "expected": "google.com", "weight": 1},
        {"input": {"url": "http://github.com"}, "expected": "github.com", "weight": 1},
        {"input": {"url": "https://sub.domain.co.uk/path"}, "expected": "sub.domain.co.uk", "weight": 1},
        {"input": {"url": "http://www.python.org"}, "expected": "python.org", "weight": 1},
        {"input": {"url": "https://openai.com"}, "expected": "openai.com", "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    45
),
(
    'word_frequency_sorted',
    'Word Frequency Ranking',
    'Write a function `solve(text)` that returns a list of lowercase words sorted descending by frequency, tie-broken alphabetically.',
    6,
    'Strings & Parsing',
    'def solve(text: str) -> list[str]:
    # Return sorted words by frequency then alphabetically
    pass
',
    '[
        {"input": {"text": "apple banana apple orange banana apple"}, "expected": ["apple", "banana", "orange"], "weight": 1},
        {"input": {"text": "dog cat bird"}, "expected": ["bird", "cat", "dog"], "weight": 1},
        {"input": {"text": ""}, "expected": [], "weight": 1},
        {"input": {"text": "one one two two three"}, "expected": ["one", "two", "three"], "weight": 1},
        {"input": {"text": "z y x"}, "expected": ["x", "y", "z"], "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    45
),
(
    'reverse_words_preserve_spaces',
    'Reverse Words in String',
    'Write a function `solve(sentence)` that reverses each individual word in a sentence while preserving word order.',
    6,
    'Strings & Parsing',
    'def solve(sentence: str) -> str:
    # Reverse each word
    pass
',
    '[
        {"input": {"sentence": "hello world"}, "expected": "olleh dlrow", "weight": 1},
        {"input": {"sentence": "Python is fun"}, "expected": "nohtyP si nuf", "weight": 1},
        {"input": {"sentence": "a"}, "expected": "a", "weight": 1},
        {"input": {"sentence": ""}, "expected": "", "weight": 1},
        {"input": {"sentence": "code quest"}, "expected": "edoc tseuq", "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    45
),

-- ============================================================================
-- TIER 7: DICTIONARIES & FREQUENCY MAPS (10 challenges, 60 XP each)
-- ============================================================================
(
    'invert_dictionary',
    'Invert Dictionary',
    'Write a function `solve(d)` that inverts keys and values of a dict. Since values may collide, group original keys in a sorted list.',
    7,
    'Dictionaries & Maps',
    'def solve(d: dict) -> dict:
    # Invert dictionary mapping
    pass
',
    '[
        {"input": {"d": {"a": 1, "b": 2, "c": 1}}, "expected": {"1": ["a", "c"], "2": ["b"]}, "weight": 1},
        {"input": {"d": {}}, "expected": {}, "weight": 1},
        {"input": {"d": {"x": 10}}, "expected": {"10": ["x"]}, "weight": 1},
        {"input": {"d": {"m": "cat", "n": "cat"}}, "expected": {"cat": ["m", "n"]}, "weight": 1},
        {"input": {"d": {"k1": 5, "k2": 6}}, "expected": {"5": ["k1"], "6": ["k2"]}, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    60
),
(
    'merge_dicts_with_sum',
    'Merge Dictionaries with Sum',
    'Write a function `solve(d1, d2)` that merges two dicts of integer values. Matching keys have their values summed.',
    7,
    'Dictionaries & Maps',
    'def solve(d1: dict[str, int], d2: dict[str, int]) -> dict[str, int]:
    # Merge dicts summing shared keys
    pass
',
    '[
        {"input": {"d1": {"a": 10, "b": 20}, "d2": {"b": 5, "c": 15}}, "expected": {"a": 10, "b": 25, "c": 15}, "weight": 1},
        {"input": {"d1": {}, "d2": {"x": 1}}, "expected": {"x": 1}, "weight": 1},
        {"input": {"d1": {"y": 2}, "d2": {}}, "expected": {"y": 2}, "weight": 1},
        {"input": {"d1": {"a": 1}, "d2": {"a": 1}}, "expected": {"a": 2}, "weight": 1},
        {"input": {"d1": {}, "d2": {}}, "expected": {}, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb,
    60
),
(
    'most_frequent_element',
    'Most Frequent Element',
    'Write a function `solve(arr)` that returns the element that appears most frequently in `arr`. Tie-break by smallest value.',
    7,
    'Dictionaries & Maps',
    'def solve(arr: list[int]) -> int:
    # Most frequent element, smallest on tie
    pass
',
    '[
        {"input": {"arr": [1, 3, 2, 1, 4, 1]}, "expected": 1, "weight": 1},
        {"input": {"arr": [10, 20, 20, 10]}, "expected": 10, "weight": 1},
        {"input": {"arr": [5]}, "expected": 5, "weight": 1},
        {"input": {"arr": [4, 4, 3, 3, 2, 2]}, "expected": 2, "weight": 1},
        {"input": {"arr": [9, 8, 9, 8, 9]}, "expected": 9, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    60
),
(
    'group_by_length',
    'Group Words by Length',
    'Write a function `solve(words)` that groups a list of words by their length into a dict `{length: [words]}`.',
    7,
    'Dictionaries & Maps',
    'def solve(words: list[str]) -> dict[int, list[str]]:
    # Group words by string length
    pass
',
    '[
        {"input": {"words": ["a", "bb", "ccc", "dd"]}, "expected": {"1": ["a"], "2": ["bb", "dd"], "3": ["ccc"]}, "weight": 1},
        {"input": {"words": []}, "expected": {}, "weight": 1},
        {"input": {"words": ["cat", "dog", "bird"]}, "expected": {"3": ["cat", "dog"], "4": ["bird"]}, "weight": 1},
        {"input": {"words": ["hi", "yo"]}, "expected": {"2": ["hi", "yo"]}, "weight": 1},
        {"input": {"words": ["test"]}, "expected": {"4": ["test"]}, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    60
),
(
    'nested_dict_get',
    'Nested Dictionary Getter',
    'Write a function `solve(data, path, default_val)` that retrieves the value at dot-separated `path` in `data`. If not found, return `default_val`.',
    7,
    'Dictionaries & Maps',
    'def solve(data: dict, path: str, default_val: any) -> any:
    # Safely get nested dict path
    pass
',
    '[
        {"input": {"data": {"user": {"profile": {"age": 14}}}, "path": "user.profile.age", "default_val": 0}, "expected": 14, "weight": 1},
        {"input": {"data": {"user": {"profile": {"name": "Amina"}}}, "path": "user.profile.age", "default_val": -1}, "expected": -1, "weight": 1},
        {"input": {"data": {}, "path": "a.b.c", "default_val": null}, "expected": null, "weight": 1},
        {"input": {"data": {"score": 100}, "path": "score", "default_val": 0}, "expected": 100, "weight": 1},
        {"input": {"data": {"a": {"b": 2}}, "path": "a.b", "default_val": 0}, "expected": 2, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 3, "max_args": 3, "require_nodes": ["Return"]}'::jsonb,
    60
),
(
    'filter_dict_by_threshold',
    'Filter Dict by Threshold',
    'Write a function `solve(scores, threshold)` that filters `scores` keeping only keys with values >= `threshold`.',
    7,
    'Dictionaries & Maps',
    'def solve(scores: dict[str, int], threshold: int) -> dict[str, int]:
    # Filter dictionary by threshold
    pass
',
    '[
        {"input": {"scores": {"Alice": 90, "Bob": 70, "Charlie": 85}, "threshold": 80}, "expected": {"Alice": 90, "Charlie": 85}, "weight": 1},
        {"input": {"scores": {"a": 10}, "threshold": 20}, "expected": {}, "weight": 1},
        {"input": {"scores": {"a": 10, "b": 20}, "threshold": 10}, "expected": {"a": 10, "b": 20}, "weight": 1},
        {"input": {"scores": {}, "threshold": 5}, "expected": {}, "weight": 1},
        {"input": {"scores": {"x": 50, "y": 50}, "threshold": 50}, "expected": {"x": 50, "y": 50}, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb,
    60
),
(
    'diff_dictionaries',
    'Compare Dictionaries',
    'Write a function `solve(old_dict, new_dict)` that returns `{"added": [keys], "removed": [keys], "modified": [keys]}` sorted alphabetically.',
    7,
    'Dictionaries & Maps',
    'def solve(old_dict: dict, new_dict: dict) -> dict:
    # Diff two dictionaries
    pass
',
    '[
        {"input": {"old_dict": {"a": 1, "b": 2, "c": 3}, "new_dict": {"b": 20, "c": 3, "d": 4}}, "expected": {"added": ["d"], "removed": ["a"], "modified": ["b"]}, "weight": 1},
        {"input": {"old_dict": {}, "new_dict": {"x": 1}}, "expected": {"added": ["x"], "removed": [], "modified": []}, "weight": 1},
        {"input": {"old_dict": {"x": 1}, "new_dict": {}}, "expected": {"added": [], "removed": ["x"], "modified": []}, "weight": 1},
        {"input": {"old_dict": {"a": 1}, "new_dict": {"a": 1}}, "expected": {"added": [], "removed": [], "modified": []}, "weight": 1},
        {"input": {"old_dict": {}, "new_dict": {}}, "expected": {"added": [], "removed": [], "modified": []}, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb,
    60
),
(
    'tally_votes',
    'Tally Election Votes',
    'Write a function `solve(votes)` that tallies votes and returns the winner name. Tie-break alphabetically.',
    7,
    'Dictionaries & Maps',
    'def solve(votes: list[str]) -> str:
    # Tally votes and return winner
    pass
',
    '[
        {"input": {"votes": ["Ada", "Alan", "Ada", "Grace"]}, "expected": "Ada", "weight": 1},
        {"input": {"votes": ["Bob", "Alice"]}, "expected": "Alice", "weight": 1},
        {"input": {"votes": ["Turing"]}, "expected": "Turing", "weight": 1},
        {"input": {"votes": ["B", "B", "A", "A", "C"]}, "expected": "A", "weight": 1},
        {"input": {"votes": ["Z", "Z", "X"]}, "expected": "Z", "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    60
),
(
    'two_sum_indices',
    'Two Sum Indices',
    'Write a function `solve(nums, target)` that returns the 0-based indices `[i, j]` of two numbers in `nums` that sum to `target`. Assume exactly one solution exists.',
    7,
    'Dictionaries & Maps',
    'def solve(nums: list[int], target: int) -> list[int]:
    # Return indices [i, j] summing to target
    pass
',
    '[
        {"input": {"nums": [2, 7, 11, 15], "target": 9}, "expected": [0, 1], "weight": 1},
        {"input": {"nums": [3, 2, 4], "target": 6}, "expected": [1, 2], "weight": 1},
        {"input": {"nums": [3, 3], "target": 6}, "expected": [0, 1], "weight": 1},
        {"input": {"nums": [1, 5, 8, 3], "target": 8}, "expected": [1, 3], "weight": 1},
        {"input": {"nums": [10, 20, 30], "target": 50}, "expected": [1, 2], "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb,
    60
),
(
    'cache_memoize_stats',
    'Cache Hit / Miss Counter',
    'Write a function `solve(queries)` where `queries` is a list of cache keys requested in order. When a key is requested the first time it is a miss; subsequent requests are hits. Return `{"hits": h, "misses": m}`.',
    7,
    'Dictionaries & Maps',
    'def solve(queries: list[str]) -> dict[str, int]:
    # Calculate hits and misses
    pass
',
    '[
        {"input": {"queries": ["user:1", "user:2", "user:1", "user:3", "user:2"]}, "expected": {"hits": 2, "misses": 3}, "weight": 1},
        {"input": {"queries": []}, "expected": {"hits": 0, "misses": 0}, "weight": 1},
        {"input": {"queries": ["a", "a", "a"]}, "expected": {"hits": 2, "misses": 1}, "weight": 1},
        {"input": {"queries": ["a", "b", "c"]}, "expected": {"hits": 0, "misses": 3}, "weight": 1},
        {"input": {"queries": ["x", "y", "x", "y"]}, "expected": {"hits": 2, "misses": 2}, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    60
),

-- ============================================================================
-- TIER 8: RECURSION & DIVIDE-AND-CONQUER (10 challenges, 80 XP each)
-- ============================================================================
(
    'recursive_power',
    'Recursive Exponentiation',
    'Write a function `solve(base, exp)` that computes `base ** exp` for non-negative integers recursively without using the `**` operator or `math.pow`.',
    8,
    'Recursion & Divide-and-Conquer',
    'def solve(base: int, exp: int) -> int:
    # Compute base ** exp recursively
    pass
',
    '[
        {"input": {"base": 2, "exp": 3}, "expected": 8, "weight": 1},
        {"input": {"base": 5, "exp": 0}, "expected": 1, "weight": 1},
        {"input": {"base": 3, "exp": 4}, "expected": 81, "weight": 1},
        {"input": {"base": 10, "exp": 1}, "expected": 10, "weight": 1},
        {"input": {"base": 7, "exp": 2}, "expected": 49, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb,
    80
),
(
    'recursive_palindrome',
    'Recursive Palindrome Check',
    'Write a function `solve(s)` that determines if string `s` is a palindrome recursively.',
    8,
    'Recursion & Divide-and-Conquer',
    'def solve(s: str) -> bool:
    # Check if string is palindrome recursively
    pass
',
    '[
        {"input": {"s": "radar"}, "expected": true, "weight": 1},
        {"input": {"s": "hello"}, "expected": false, "weight": 1},
        {"input": {"s": ""}, "expected": true, "weight": 1},
        {"input": {"s": "a"}, "expected": true, "weight": 1},
        {"input": {"s": "noon"}, "expected": true, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    80
),
(
    'sum_nested_numeric',
    'Sum Nested Numeric List',
    'Write a function `solve(nested)` that recursively sums all integers in an arbitrarily nested list of lists.',
    8,
    'Recursion & Divide-and-Conquer',
    'def solve(nested: list) -> int:
    # Recursively sum all numbers in nested lists
    pass
',
    '[
        {"input": {"nested": [1, [2, [3, 4], 5], 6]}, "expected": 21, "weight": 1},
        {"input": {"nested": []}, "expected": 0, "weight": 1},
        {"input": {"nested": [[10], [20]]}, "expected": 30, "weight": 1},
        {"input": {"nested": [5, 5, 5]}, "expected": 15, "weight": 1},
        {"input": {"nested": [[[[7]]]]}, "expected": 7, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    80
),
(
    'binary_search_recursive',
    'Binary Search',
    'Write a function `solve(arr, target)` that performs binary search on a sorted list `arr`, returning the index of `target`, or `-1` if not found.',
    8,
    'Recursion & Divide-and-Conquer',
    'def solve(arr: list[int], target: int) -> int:
    # Binary search for target in sorted arr
    pass
',
    '[
        {"input": {"arr": [1, 3, 5, 7, 9, 11], "target": 7}, "expected": 3, "weight": 1},
        {"input": {"arr": [1, 3, 5, 7, 9, 11], "target": 1}, "expected": 0, "weight": 1},
        {"input": {"arr": [1, 3, 5, 7, 9, 11], "target": 11}, "expected": 5, "weight": 1},
        {"input": {"arr": [1, 3, 5, 7, 9, 11], "target": 4}, "expected": -1, "weight": 1},
        {"input": {"arr": [], "target": 5}, "expected": -1, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb,
    80
),
(
    'gcd_euclid',
    'Greatest Common Divisor',
    'Write a function `solve(a, b)` that calculates the Greatest Common Divisor of two positive integers using Euclidean recursion.',
    8,
    'Recursion & Divide-and-Conquer',
    'def solve(a: int, b: int) -> int:
    # GCD using Euclidean recursion
    pass
',
    '[
        {"input": {"a": 48, "b": 18}, "expected": 6, "weight": 1},
        {"input": {"a": 101, "b": 10}, "expected": 1, "weight": 1},
        {"input": {"a": 25, "b": 25}, "expected": 25, "weight": 1},
        {"input": {"a": 54, "b": 24}, "expected": 6, "weight": 1},
        {"input": {"a": 100, "b": 10}, "expected": 10, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 2, "max_args": 2, "require_nodes": ["Return"]}'::jsonb,
    80
),
(
    'flatten_deep',
    'Deep List Flattening',
    'Write a function `solve(nested)` that recursively flattens an arbitrarily nested list into a flat list.',
    8,
    'Recursion & Divide-and-Conquer',
    'def solve(nested: list) -> list:
    # Deeply flatten arbitrary nested lists
    pass
',
    '[
        {"input": {"nested": [1, [2, [3, [4]]], 5]}, "expected": [1, 2, 3, 4, 5], "weight": 1},
        {"input": {"nested": []}, "expected": [], "weight": 1},
        {"input": {"nested": [[1, 2], [3, 4]]}, "expected": [1, 2, 3, 4], "weight": 1},
        {"input": {"nested": [1, [2], [[3]]]}, "expected": [1, 2, 3], "weight": 1},
        {"input": {"nested": [[[[[9]]]]]}, "expected": [9], "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    80
),
(
    'count_tree_leaves',
    'Count Binary Tree Leaves',
    'Write a function `solve(tree)` that counts the number of leaf nodes in a binary tree represented as dicts `{"val": v, "left": node, "right": node}` or `None`. A leaf has both `left` and `right` equal to `None`.',
    8,
    'Recursion & Divide-and-Conquer',
    'def solve(tree: dict) -> int:
    # Count leaf nodes in binary tree dict
    pass
',
    '[
        {"input": {"tree": {"val": 1, "left": {"val": 2, "left": null, "right": null}, "right": {"val": 3, "left": null, "right": null}}}, "expected": 2, "weight": 1},
        {"input": {"tree": {"val": 1, "left": null, "right": null}}, "expected": 1, "weight": 1},
        {"input": {"tree": null}, "expected": 0, "weight": 1},
        {"input": {"tree": {"val": 1, "left": {"val": 2, "left": null, "right": null}, "right": null}}, "expected": 1, "weight": 1},
        {"input": {"tree": {"val": 1, "left": {"val": 2, "left": {"val": 4, "left": null, "right": null}, "right": {"val": 5, "left": null, "right": null}}, "right": {"val": 3, "left": null, "right": null}}}, "expected": 3, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    80
),
(
    'tower_of_hanoi_count',
    'Tower of Hanoi Minimum Moves',
    'Write a function `solve(n)` that calculates the minimum number of moves required to solve the Tower of Hanoi puzzle with `n` disks (formula $2^n - 1$).',
    8,
    'Recursion & Divide-and-Conquer',
    'def solve(n: int) -> int:
    # Minimum moves for n disks
    pass
',
    '[
        {"input": {"n": 1}, "expected": 1, "weight": 1},
        {"input": {"n": 3}, "expected": 7, "weight": 1},
        {"input": {"n": 4}, "expected": 15, "weight": 1},
        {"input": {"n": 5}, "expected": 31, "weight": 1},
        {"input": {"n": 10}, "expected": 1023, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    80
),
(
    'generate_permutations',
    'String Permutations',
    'Write a function `solve(s)` that generates all unique permutations of a short string `s`, returned as a sorted list of strings.',
    8,
    'Recursion & Divide-and-Conquer',
    'def solve(s: str) -> list[str]:
    # Return sorted list of all permutations
    pass
',
    '[
        {"input": {"s": "ab"}, "expected": ["ab", "ba"], "weight": 1},
        {"input": {"s": "abc"}, "expected": ["abc", "acb", "bac", "bca", "cab", "cba"], "weight": 1},
        {"input": {"s": "a"}, "expected": ["a"], "weight": 1},
        {"input": {"s": ""}, "expected": [""], "weight": 1},
        {"input": {"s": "aa"}, "expected": ["aa"], "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    80
),
(
    'climb_stairs_ways',
    'Climbing Stairs Possibilities',
    'Write a function `solve(n)` that returns the number of distinct ways to climb a staircase of `n` steps, taking 1 or 2 steps at a time.',
    8,
    'Recursion & Divide-and-Conquer',
    'def solve(n: int) -> int:
    # Ways to climb n stairs taking 1 or 2 steps
    pass
',
    '[
        {"input": {"n": 1}, "expected": 1, "weight": 1},
        {"input": {"n": 2}, "expected": 2, "weight": 1},
        {"input": {"n": 3}, "expected": 3, "weight": 1},
        {"input": {"n": 4}, "expected": 5, "weight": 1},
        {"input": {"n": 5}, "expected": 8, "weight": 1}
    ]'::jsonb,
    '{"required_function": "solve", "min_args": 1, "max_args": 1, "require_nodes": ["Return"]}'::jsonb,
    80
);
