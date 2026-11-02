export class LowPassFilter {
	private y: number | null = null;
	private s: number | null = null;

	constructor(private alpha: number = 0.5) {}

	setAlpha(alpha: number) {
		this.alpha = Math.max(0, Math.min(1, alpha));
	}

	filter(value: number): number {
		if (this.y === null) {
			this.s = value;
			this.y = value;
			return value;
		}
		this.y = this.alpha * value + (1 - this.alpha) * (this.s ?? value);
		this.s = this.y;
		return this.y;
	}

	lastValue(): number | null {
		return this.y;
	}

	reset() {
		this.y = null;
		this.s = null;
	}
}

export class OneEuroFilter {
	private xFilter: LowPassFilter;
	private dxFilter: LowPassFilter;
	private lastTime: number | null = null;

	constructor(
		private minCutoff: number = 1.0,
		private beta: number = 0.007,
		private dCutoff: number = 1.0,
	) {
		this.xFilter = new LowPassFilter(this.alpha(minCutoff, 1 / 60));
		this.dxFilter = new LowPassFilter(this.alpha(dCutoff, 1 / 60));
	}

	private alpha(cutoff: number, dt: number): number {
		const tau = 1.0 / (2 * Math.PI * cutoff);
		return 1.0 / (1.0 + tau / dt);
	}

	filter(value: number, timestampSec: number): number {
		if (this.lastTime === null) {
			this.lastTime = timestampSec;
			return this.xFilter.filter(value);
		}

		const dt = Math.max(1e-4, timestampSec - this.lastTime);
		this.lastTime = timestampSec;

		const prevX = this.xFilter.lastValue();
		const dx = prevX === null ? 0 : (value - prevX) / dt;
		const edx = this.dxFilter.filter(dx);
		this.dxFilter.setAlpha(this.alpha(this.dCutoff, dt));

		const cutoff = this.minCutoff + this.beta * Math.abs(edx);
		this.xFilter.setAlpha(this.alpha(cutoff, dt));

		return this.xFilter.filter(value);
	}

	reset() {
		this.lastTime = null;
		this.xFilter.reset();
		this.dxFilter.reset();
	}
}

export class OneEuroFilter2D {
	private filterX: OneEuroFilter;
	private filterY: OneEuroFilter;

	constructor(minCutoff: number = 1.0, beta: number = 0.007) {
		this.filterX = new OneEuroFilter(minCutoff, beta);
		this.filterY = new OneEuroFilter(minCutoff, beta);
	}

	filter(x: number, y: number, timestampSec: number): { x: number; y: number } {
		return {
			x: this.filterX.filter(x, timestampSec),
			y: this.filterY.filter(y, timestampSec),
		};
	}

	reset() {
		this.filterX.reset();
		this.filterY.reset();
	}
}
