export class Rng {
  a: number;
  b: number;
  c: number;
  d: number;

  constructor(seed: ArrayLike<number>) {
    this.a = seed[0] | 0;
    this.b = seed[1] | 0;
    this.c = seed[2] | 0;
    this.d = seed[3] | 0;
    for (let i = 0; i < 16; i++) this.next();
  }

  next() {
    const t = (((this.a + this.b) | 0) + this.d) | 0;
    this.d = (this.d + 1) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.c = (this.c + t) | 0;
    return (t >>> 0) / 4294967296;
  }

  int(n: number) {
    return (this.next() * n) | 0;
  }

  static fresh() {
    const seed = new Uint32Array(4);
    try {
      crypto.getRandomValues(seed);
    } catch {
      for (let i = 0; i < 4; i++) seed[i] = Math.floor(Math.random() * 4294967296);
    }
    return new Rng(seed);
  }
}
