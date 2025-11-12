"""
Unit-тесты для модуля сортировки кучей (Heap Sort)

Для запуска тестов используйте команду:
    python -m unittest test_sort.py
или
    python test_sort.py
"""

import unittest
from main import heap_sort, heapify


class TestHeapSort(unittest.TestCase):
    """Класс для тестирования функции heap_sort"""
    
    def test_basic_sort(self):
        """Тест базовой сортировки"""
        arr = [12, 11, 13, 5, 6, 7]
        expected = [5, 6, 7, 11, 12, 13]
        result = heap_sort(arr.copy())
        self.assertEqual(result, expected)
    
    def test_already_sorted(self):
        """Тест сортировки уже отсортированного массива"""
        arr = [1, 2, 3, 4, 5]
        expected = [1, 2, 3, 4, 5]
        result = heap_sort(arr.copy())
        self.assertEqual(result, expected)
    
    def test_reverse_sorted(self):
        """Тест сортировки массива, отсортированного в обратном порядке"""
        arr = [5, 4, 3, 2, 1]
        expected = [1, 2, 3, 4, 5]
        result = heap_sort(arr.copy())
        self.assertEqual(result, expected)
    
    def test_empty_array(self):
        """Тест сортировки пустого массива"""
        arr = []
        expected = []
        result = heap_sort(arr.copy())
        self.assertEqual(result, expected)
    
    def test_single_element(self):
        """Тест сортировки массива с одним элементом"""
        arr = [42]
        expected = [42]
        result = heap_sort(arr.copy())
        self.assertEqual(result, expected)
    
    def test_duplicates(self):
        """Тест сортировки массива с повторяющимися элементами"""
        arr = [3, 3, 3, 3]
        expected = [3, 3, 3, 3]
        result = heap_sort(arr.copy())
        self.assertEqual(result, expected)
    
    def test_mixed_duplicates(self):
        """Тест сортировки массива со смешанными повторяющимися элементами"""
        arr = [5, 2, 8, 2, 9, 5, 1]
        expected = [1, 2, 2, 5, 5, 8, 9]
        result = heap_sort(arr.copy())
        self.assertEqual(result, expected)
    
    def test_negative_numbers(self):
        """Тест сортировки массива с отрицательными числами"""
        arr = [-5, -2, -8, 1, 9, -3]
        expected = [-8, -5, -3, -2, 1, 9]
        result = heap_sort(arr.copy())
        self.assertEqual(result, expected)
    
    def test_large_array(self):
        """Тест сортировки большого массива"""
        arr = list(range(100, 0, -1))
        expected = list(range(1, 101))
        result = heap_sort(arr.copy())
        self.assertEqual(result, expected)
    
    def test_in_place_modification(self):
        """Тест, что функция изменяет исходный массив in-place"""
        arr = [3, 1, 4, 1, 5]
        original_id = id(arr)
        result = heap_sort(arr)
        # Проверяем, что это тот же объект
        self.assertEqual(id(result), original_id)
        # Проверяем, что массив отсортирован
        self.assertEqual(result, [1, 1, 3, 4, 5])
    
    def test_example_from_main(self):
        """Тест примеров из основного файла"""
        test_cases = [
            [64, 34, 25, 12, 22, 11, 90],
            [5, 2, 8, 1, 9],
            [1],
            [3, 3, 3, 3],
            []
        ]
        
        for test in test_cases:
            with self.subTest(test=test):
                result = heap_sort(test.copy())
                expected = sorted(test)
                self.assertEqual(result, expected)


class TestHeapify(unittest.TestCase):
    """Класс для тестирования функции heapify"""
    
    def test_heapify_single_element(self):
        """Тест heapify для одного элемента"""
        arr = [1]
        heapify(arr, 1, 0)
        self.assertEqual(arr, [1])
    
    def test_heapify_small_heap(self):
        """Тест heapify для маленькой кучи"""
        arr = [1, 3, 2]
        heapify(arr, 3, 0)
        # После heapify корень должен быть наибольшим
        self.assertEqual(arr[0], 3)
    
    def test_heapify_already_heap(self):
        """Тест heapify для уже правильной кучи"""
        arr = [3, 1, 2]
        heapify(arr, 3, 0)
        # Структура должна остаться правильной
        self.assertEqual(arr[0], 3)


if __name__ == "__main__":
    # Запуск тестов
    unittest.main(verbosity=2)

