import { Context } from "./Context";

export interface material_options {
	handle?: (ctx: Context) => WebGLTexture,

	color?: Array<number>,
	url?: string,
	target?: GLenum,
	dataTarget?: GLenum
}

// Constants used in the Material File
const level = 0;
const internalFormat = WebGLRenderingContext.RGBA;
const width = 1;
const height = 1;
const border = 0;
const srcFormat = WebGLRenderingContext.RGBA;
const srcType = WebGLRenderingContext.UNSIGNED_BYTE;

export class Material {
	handle: WebGLTexture;
	ctx: Context;

	color: Array<number>;
	url: string;
	target: GLenum;
	dataTarget: GLenum;

	private _generated = false;

	constructor(ctx: Context, opts: material_options) {
		// Generate the texture
		this.handle = opts.handle ? opts.handle(ctx) : ctx.gl.createTexture();
		this.ctx = ctx;

		this.color  = opts.color ? opts.color : [0, 0, 255, 255]; // Default blue
		this.url    = opts.url;
		this.target = opts.target ? opts.target : this.ctx.gl.TEXTURE_2D;

		this.dataTarget = opts.dataTarget ? opts.dataTarget : this.target;
	}

	use(active_texture: GLenum = WebGLRenderingContext.TEXTURE0) {
		return this.bind(active_texture);
	}

	bind(active_texture: GLenum = WebGLRenderingContext.TEXTURE0) {
		this.ctx.gl.activeTexture(active_texture);
		this.ctx.gl.bindTexture(this.target, this.handle);

		// Generate the texture
		this.generate();
	}

	generate() {
		// Skip if not needed
		if (this._generated) return;

		// Because images have to be download over the internet
		// they might take a moment until they are ready.
		// Until then put a single pixel in the texture so we can
		// use it immediately. When the image has finished downloading
		// we'll update the texture with the contents of the image.
		this.value = this.color;

		if (this.url) {
			// Generate an image for loading the specified url
			const image = new Image();
			const self = this;
			image.onload = function() {
				self.value = image;
			};

			// Start loading the image
			image.src = this.url;
		}

		this._generated = true;
	}

	set value(new_val: Array<number> | HTMLImageElement | HTMLVideoElement) {
		this.ctx.gl.bindTexture(this.target, this.handle);

		if (new_val instanceof HTMLImageElement || new_val instanceof HTMLVideoElement) {
			this.ctx.gl.texImage2D(
				this.dataTarget,
				level,
				internalFormat,
				srcFormat, srcType,
				new_val
			);

			if (new_val instanceof HTMLImageElement && this.isPowerOf2(new_val.width) && this.isPowerOf2(new_val.height)) {
				// Yes, it's a power of 2. Generate mips.
				this.ctx.gl.generateMipmap(this.target);

			} else {
				// No, it's not a power of 2. Turn off mips and set
				// wrapping to clamp to edge
				this.ctx.gl.texParameteri(this.target, this.ctx.gl.TEXTURE_WRAP_S, this.ctx.gl.CLAMP_TO_EDGE);
				this.ctx.gl.texParameteri(this.target, this.ctx.gl.TEXTURE_WRAP_T, this.ctx.gl.CLAMP_TO_EDGE);
				this.ctx.gl.texParameteri(this.target, this.ctx.gl.TEXTURE_MIN_FILTER, this.ctx.gl.LINEAR);
			}
		} else {
			this.ctx.gl.texImage2D(
				this.dataTarget,
				level,
				internalFormat,
				width, height,
				border,
				srcFormat, srcType,
				new Uint8Array(new_val)
			);
		}

		this._generated = true;
	}

	// Checks if a number is a power of 2
	private isPowerOf2 = (value: number) => {
		return (value & (value - 1)) == 0;
	}
};