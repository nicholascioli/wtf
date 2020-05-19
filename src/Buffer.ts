import { Context } from "./Context";

// Custom Errors for Buffers
export class BufferError implements Error {
	name: string = "BufferError";
	message: string;

	constructor(message?: string) {
		this.message = message ? message : "";
	}
}

export class Buffer {
	ctx: Context;
	handle: WebGLBuffer;

	private _bound_type: any;
	private _is_bound: boolean = false;
	private _value: Array<number> = [];

	constructor(ctx: Context, initial_data: Array<number> = [], as_index: boolean = false) {
		this.ctx = ctx;
		this.handle = this.ctx.gl.createBuffer();

		// FIXME: Why is this always false? Too fast?
		// if (!this.ctx.gl.isBuffer(this.handle))
		// 	throw new BufferError("Could not create buffer. gl.createBuffer() returned a non-valid buffer handle.");

		// Set the type of buffer to typically bind to
		this._bound_type = as_index ? this.ctx.gl.ELEMENT_ARRAY_BUFFER : this.ctx.gl.ARRAY_BUFFER;

		// Set the initial value
		this.value = initial_data;
	}

	// Getter / setter for the value
	get value(): Array<number> {
		return this._value;
	}

	set value(nv: Array<number>) {
		// Get currently bound buffer
		let previous = this.ctx.gl.getParameter(
			this._bound_type == this.ctx.gl.ELEMENT_ARRAY_BUFFER ?
				this.ctx.gl.ELEMENT_ARRAY_BUFFER_BINDING : this.ctx.gl.ARRAY_BUFFER_BINDING
		);

		// Bind this buffer
		this.ctx.gl.bindBuffer(this._bound_type, this.handle);

		// Set its data
		this.ctx.gl.bufferData(
			this._bound_type,
			(this._bound_type == WebGLRenderingContext.ARRAY_BUFFER) ? new Float32Array(nv) : new Uint16Array(nv),
			this.ctx.gl.STATIC_DRAW
		);
		this._value = nv;

		// Rebind the previous buffer
		this.ctx.gl.bindBuffer(this._bound_type, previous);
	}

	// Binding ops
	bind() {
		this.ctx.gl.bindBuffer(this._bound_type, this.handle);
		this._is_bound = true;
	}

	use() {
		this.bind();
	}

	unbind() {
		if (this._is_bound)
			this.ctx.gl.bindBuffer(this._bound_type, null);

		this._is_bound = false;
	}

	unuse() {
		this.unbind();
	}
}