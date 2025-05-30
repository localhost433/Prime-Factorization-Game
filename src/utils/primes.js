// src/utils/primes.js

export const primesUnder316 = [
    2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47,
    53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107,
    109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167,
    173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229,
    233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283,
    293, 307, 311, 313
];

export function isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
        if (n % i === 0) return false;
    }
    return true;
}

export function calculateFullFactorization(n) {
    if (!Number.isInteger(n) || n < 2) return '';
    let copy = n, out = [];
    for (const p of primesUnder316) {
        if (p * p > copy) break;
        let cnt = 0;
        while (copy % p === 0) { copy /= p; ++cnt; }
        if (cnt) out.push(cnt > 1 ? `${p}^${cnt}` : `${p}`);
    }
    if (copy > 1) out.push(`${copy}`);
    return out.join(' × ');
}

export function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
