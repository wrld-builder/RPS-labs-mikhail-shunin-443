export function normalizeArrayInput(numbers) {
  if (!Array.isArray(numbers)) {
    throw new Error('numbers must be an array');
  }
  return numbers.map((value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      throw new Error('Array must contain only finite numbers');
    }
    return Math.trunc(numericValue);
  });
}

export function lab2Sort(numbers) {
  const arr = normalizeArrayInput(numbers);
  const data = [...arr];
  const size = data.length;

  const swap = (i, j) => {
    const temp = data[i];
    data[i] = data[j];
    data[j] = temp;
  };

  const heapify = (endIndex, parentIndex) => {
    let largest = parentIndex;
    const left = 2 * parentIndex + 1;
    const right = 2 * parentIndex + 2;

    if (left <= endIndex && data[left] > data[largest]) {
      largest = left;
    }
    if (right <= endIndex && data[right] > data[largest]) {
      largest = right;
    }

    if (largest !== parentIndex) {
      swap(parentIndex, largest);
      heapify(endIndex, largest);
    }
  };

  for (let i = Math.floor(size / 2) - 1; i >= 0; i -= 1) {
    heapify(size - 1, i);
  }

  for (let end = size - 1; end > 0; end -= 1) {
    swap(0, end);
    heapify(end - 1, 0);
  }

  return data;
}
