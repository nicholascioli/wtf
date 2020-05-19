import { Buffer } from "./Buffer";
import { Model } from "./Model";
import { Indexable } from "./Indexable";
import { Material, material_options } from "./Material";
import { ShaderProgram } from "./ShaderProgram";

export class ContextError implements Error {
	name: string = "ContextError";
	message: string = "";

	constructor(message?: string) {
		this.message = message ? message : "";
	}
}

export class ContextInfo {
	canvas_id?: string;
	antialias?: boolean;
	preserveDrawingBuffer?: boolean;
}

export class Context {
	gl: WebGLRenderingContext

	private buffers: Indexable<Buffer> = {};
	private materials: Indexable<Material> = {};
	private programs: Indexable<ShaderProgram> = {};

	constructor(info: ContextInfo = {}) {
		let canvas: HTMLCanvasElement;

		// Find the canvas
		if (info.canvas_id)
			canvas = document.getElementById(info.canvas_id) as HTMLCanvasElement;
		else
			canvas = document.getElementsByTagName("canvas")[0];

		if (!canvas) throw new ContextError("Could not find canvas");

		// Generate the WebGL Canvas Context
		this.gl = canvas.getContext("webgl", {
			antialias: info.antialias || false,
			preserveDrawingBuffer: info.preserveDrawingBuffer || false
		});

		// Check for support
		if (!this.gl) throw new Error("Unsupported browser!");

		// Fix the size
		let cv = this.gl.canvas as HTMLCanvasElement;
		this.gl.canvas.width  = cv.clientWidth;
		this.gl.canvas.height = cv.clientHeight;
		this.gl.viewport(0, 0, cv.clientWidth, cv.clientHeight);
	}

	get_buffer(for_obj: any, as_index: boolean, suffix?: string) {
		let id = this.objectId(for_obj) + suffix;

		if (!this.buffers[id]) {
			// console.log(`Creating buffer for object with id ${id}`);
			this.buffers[id] = new Buffer(this, [], as_index);
		}

		return this.buffers[id];
	}

	get_program(for_obj: any, name: string, vertex: string, fragment: string) {
		let id = this.objectId(for_obj) + "_" + name;

		if (!this.programs[id]) {
			this.programs[id] = new ShaderProgram(this, vertex, fragment);
		}

		return this.programs[id];
	}

	get_material(for_obj: any, name: string, opts: material_options) {
		let id = this.objectId(for_obj) + "_" + name;

		if (!this.materials[id]) {
			this.materials[id] = new Material(this, opts);
		}

		return this.materials[id];
	}

	// Note that object must be an object or array,
	// NOT a primitive value like string, number, etc.
	private objIdMap: WeakMap<any, number> = new WeakMap();
	private objectCount = 0;
	private objectId(object: any) {
		if (!this.objIdMap.has(object)) this.objIdMap.set(object, ++this.objectCount);
		return this.objIdMap.get(object);
	}
}