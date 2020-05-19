import { Context } from "./Context";
import { Indexable } from "./Indexable";
import { Uniform } from "./Shader/Uniform";
import { Attribute, AttributeInfo, FLOAT_SIZE } from "./Shader/Attribute";

// Custom Errors for Shaders
export class ShaderError implements Error {
	name: string = "ShaderError";
	message: string;

	constructor(message?: string) {
		this.message = message ? message : "";
	}
}

// Custom Errors for Programs
export class ProgramError implements Error {
	name: string = "ProgramError";
	message: string;

	constructor(message?: string) {
		this.message = message ? message : "";
	}
}

/**
 * ShaderProgram
 * -------------
 * Takes in a vertex and fragment shader source and returns
 * a compiled GL program.
 *
 * -
 *
 * Identifies all uniforms and attributes and populates a map
 * of them, by name, for custom setting and getting. Attempts to do type verification
 * when passing a value to set.
 */
export class ShaderProgram {
	gl: WebGLRenderingContext;
	program: WebGLProgram;

	attribs:  Indexable<Attribute> = {};
	uniforms: Indexable<Uniform>   = {};

	private _bound: boolean = false;

	// Constructs the ShaderProgram
	constructor(gl: (WebGLRenderingContext | Context), vertex: string, fragment: string) {
		// Save the gl context for later
		this.gl = ((<Context>gl).gl ? (<Context>gl).gl : <WebGLRenderingContext>gl);

		// Compile the vertex and fragment shader
		let v_sha = this.compile_shader(this.gl.VERTEX_SHADER, vertex);
		let f_sha = this.compile_shader(this.gl.FRAGMENT_SHADER, fragment);

		// Link the shader
		this.program = this.link_shader([v_sha, f_sha]);

		// Get attribute and uniform counts
		let attrib_count = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_ATTRIBUTES);
		let unifor_count = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_UNIFORMS);

		// Get reference to this class in order to use when defining the inner class
		let outer = this;

		// Map the attributes to accessors / setters
		for (let i = 0; i != attrib_count; ++i) {
			let info = this.gl.getActiveAttrib(this.program, i);
			let loc  = this.gl.getAttribLocation(this.program, info.name);

			// Here we define an inner class in order to gain access to the ShaderProgram members
			this.attribs[info.name] = new class implements Attribute {
				_enabled: boolean = false;
				_value: any;
				handle = loc;

				/**
				 * enable
				 * ----
				 * Enables an attribute
				 * @param inf [AttributeInfo] A set of properties for the given attribute (stride, offset, etc.)
				 */
				enable(inf?: AttributeInfo) {
					// Get type info
					let [count, _, base_type] = outer.decompose_type(info.type);

					// Specify info
					outer.gl.enableVertexAttribArray(loc);
					outer.gl.vertexAttribPointer(
						loc,
						count,
						base_type,
						(inf && inf.normalize) ? inf.normalize : false,
						((inf && inf.stride) ? inf.stride : 0) * FLOAT_SIZE,
						((inf && inf.offset) ? inf.offset : 0) * FLOAT_SIZE
					);

					this._enabled = true;
				}

				/**
				 * disable
				 * -------
				 * Disables an attribute
				 */
				disable() {
					outer.gl.disableVertexAttribArray(loc);
					this._enabled = false;
				}

				/**
				 * get value
				 * ---------
				 * Returns the actual value of the attribute
				 */
				get value() { return this._value; };

				/**
				 * set value
				 * ---------
				 * Attempts to set an attribute, if types match
				 */
				set value(val: any) {
					let should_unbind = !outer._bound;

					// Bind for use
					if (!outer._bound) outer.bind();

					let [count, alias, _] = outer.decompose_type(info.type);
					outer.assert_type(alias, count, val);

					// Run the corresponding function
					(<any>outer.gl)[`vertexAtrrib${alias}`](loc, val);

					// Set the internal value
					this._value = val;

					// Unbind, if needed
					if (should_unbind) outer.unbind();
				};
			};
		}

		// Map the uniforms to accessors / setters
		for (let i = 0; i != unifor_count; ++i) {
			let info = this.gl.getActiveUniform(this.program, i);
			let loc  = this.gl.getUniformLocation(this.program, info.name);

			// Here we define an inner class in order to gain access to the ShaderProgram members
			this.uniforms[info.name] = new class implements Uniform {
				_value: any;
				get value() { return this._value; }
				set value(val: any) {
					let should_unbind = !outer._bound;

					// Bind for use
					if (!outer._bound) outer.bind();

					let [count, alias, _] = outer.decompose_type(info.type);
					outer.assert_type(alias, count, val);

					// Run the corresponding function
					if (alias.includes("Matrix")) {
						(<any>outer.gl)[`uniform${alias}`](loc, false, val);
					} else {
						(<any>outer.gl)[`uniform${alias}`](loc, val);
					}

					// Set the internal value
					this._value = val;

					// Unbind, if needed
					if (should_unbind) outer.unbind();
				}
			};
		}
	}

	// Allow for using the program
	use() {
		this.gl.useProgram(this.program);
		this._bound = true;
	}

	// Aliased for use
	bind() {
		this.use();
	}

	// Allow for not using the program
	unuse() {
		this.gl.useProgram(null);
		this._bound = false;
	}

	// Alias for unuse
	unbind() {
		this.unuse();
	}

	/**
	 * fromUrl
	 * -------
	 * Asynchronously creates a shader program from URLs
	 *
	 * @param gl WebGL Rendering Context
	 * @param vertexUrl URL from which to fetch a vertex shader
	 * @param fragmentUrl URL from which to fetch a fragment shader
	 */
	static async fromUrl(gl: (WebGLRenderingContext | Context), vertexUrl: string, fragmentUrl: string): Promise<ShaderProgram> {
		let vert = await fetch(vertexUrl);
		let frag = await fetch(fragmentUrl);

		let vertTxt = await vert.text();
		let fragTxt = await frag.text();

		return new ShaderProgram(gl, vertTxt, fragTxt);
	}

	//
	private assert_type(type: string, count: number, v: any) {
		if (
			(count == 1 && typeof v !== "number") ||
			(count != 1 && (<Array<number>>v).length !== count)
		) {
			console.log("YEET:", count, v, (<Array<number>>v).length);
			console.error(`Wrong type of value for type ${type} and count ${count}: Got [${v}] -> ${typeof v}`);
			throw new ProgramError(`Wrong type of value for type ${type} and count ${count}: Got [${v}] -> ${typeof v}`);
		}
	};

	private compile_shader(type: GLenum, source: string) {
		let shader = this.gl.createShader(type);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);

		// Check for correct compilation
		if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS))
			return shader;

		// Otherwise, clean-up
		let str_type = type == this.gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT";
		let error = this.gl.getShaderInfoLog(shader);
		this.gl.deleteShader(shader);

		// Throw to stop execution
		throw new ShaderError(`Shader error in ${str_type}: ${error}`);
	}

	private link_shader(shaders: Array<WebGLShader>) {
		var program = this.gl.createProgram();

		// Link all supplied shaders
		shaders.forEach(sha => this.gl.attachShader(program, sha));
		this.gl.linkProgram(program);

		// Check if properly linked
		if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS))
			return program;

		// Clean up if fail
		let error = this.gl.getProgramInfoLog(program);
		this.gl.deleteProgram(program);

		throw new ProgramError(error);
	}

	/**
	 * decompose_type
	 * --------------
	 * Decomposes a type into the count of values, OpenGL alias (i, f, bv, etc.), and the
	 * raw base type (float, int, etc.) given an enclosing type.
	 *
	 * @param type The type to decompose
	 */
	private decompose_type(type: GLenum): [number, string, GLenum] {
		switch (type) {
			// Single values
			case WebGLRenderingContext.BOOL:
				return [1, "1b", type];
			case WebGLRenderingContext.INT:
				return [1, "1i", type];
			case WebGLRenderingContext.FLOAT:
				return [1, "1f", type];

			// Vectors
			case WebGLRenderingContext.BOOL_VEC2:
				return [2, "2bv", WebGLRenderingContext.BOOL];
			case WebGLRenderingContext.INT_VEC2:
				return [2, "2iv", WebGLRenderingContext.INT];
			case WebGLRenderingContext.FLOAT_VEC2:
				return [2, "2fv", WebGLRenderingContext.FLOAT];

			case WebGLRenderingContext.BOOL_VEC3:
				return [3, "3bv", WebGLRenderingContext.BOOL];
			case WebGLRenderingContext.INT_VEC3:
				return [3, "3iv", WebGLRenderingContext.INT];
			case WebGLRenderingContext.FLOAT_VEC3:
				return [3, "3fv", WebGLRenderingContext.FLOAT];

			case WebGLRenderingContext.BOOL_VEC4:
				return [4, "4bv", WebGLRenderingContext.BOOL];
			case WebGLRenderingContext.INT_VEC4:
				return [4, "4iv", WebGLRenderingContext.INT];
			case WebGLRenderingContext.FLOAT_VEC4:
				return [4, "4fv", WebGLRenderingContext.FLOAT];

			// Matrices
			case WebGLRenderingContext.FLOAT_MAT2:
				return [4,  "Matrix2fv", WebGLRenderingContext.FLOAT];
			case WebGLRenderingContext.FLOAT_MAT3:
				return [9,  "Matrix3fv", WebGLRenderingContext.FLOAT];
			case WebGLRenderingContext.FLOAT_MAT4:
				return [16, "Matrix4fv", WebGLRenderingContext.FLOAT];

			// Uncommon ones
			case WebGLRenderingContext.SAMPLER_CUBE:
				return [1, "1i", WebGLRenderingContext.INT];
			case WebGLRenderingContext.SAMPLER_2D:
				return [1, "1i", WebGLRenderingContext.INT];

			default:
				let key = Object.keys(WebGLRenderingContext).find(k => (<any>WebGLRenderingContext)[k] === type);
				throw new ProgramError(`Unknown type to decompose: ${key} (${type})`);
		}
	}
}