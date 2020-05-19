import { Attribute, FLOAT_SIZE, SHORT_SIZE } from "./Shader/Attribute";
import { Context } from "./Context";
import { Indexable } from "./Indexable";
import { material_options } from "./Material";

export class BoundInfo {
	max: number;
	min: number;
	length: number = 0;

	constructor(initial: number) {
		this.max = this.min = initial;
	}

	update(value: number) {
		if (value > this.max) this.max = value;
		if (value < this.min) this.min = value;

		this.length = this.max - this.min;
	}
}

export interface model_options {
	position: Attribute;
	texture?: Attribute;
	normal?:  Attribute;
}

export class ModelError {
	name: string = "ModelError";
	message: string;

	constructor(message?: string) {
		this.message = message ? message : "";
	}
}

export class Model {
	static FULL_OBJ: string = "__FULL_MODEL__";
	static DEFAULT_MATERIAL: string = "__DEFAULT_MATERIAL__";

	vertices: Indexable<Array<number>>;
	normals: Indexable<Array<number>>;
	textures: Indexable<Array<number>>;

	materials: Indexable<material_options>;
	mat_map: Indexable<string>;

	// Bounding box information
	bounds: Indexable<Indexable<BoundInfo>> = {};

	/**
	 * load_from_file
	 * --------------
	 * Attempt to asynchronously load an object (.obj) file
	 * given a path.
	 *
	 * @param obj_path Path to OBJ file to load
	 */
	static async load_from_file(obj_path: string): Promise<Model> {
		// Fetch the file contents
		let file = await fetch(obj_path);
		let contents = await file.text();

		// Resulting model
		let result = new Model();

		// Split into lines
		let lines = contents.split('\n');

		// Read by grouping
		let current = Model.FULL_OBJ;
		let mat = Model.DEFAULT_MATERIAL;

		// Gather information from the model line by line
		let verts: Array<Array<number>> = [];
		let norms: Array<Array<number>> = [];
		let texts: Array<Array<number>> = [];

		let mat_index = 0;
		for (let i = 0; i != lines.length; ++i) {
			let args = lines[i].split(" ");

			// Object parsing
			// Save the current object name for pushing faces
			if (args[0] == "o") {
				current = args[1];

			} else if (args[0] == "mtllib") {
				let parent = obj_path.substr(0, obj_path.lastIndexOf("/")) + "/";
				result.add_materials(
					await (
						await fetch(parent + args[1])
					).text(),
					parent
				);

			} else if (args[0] == "usemtl") {
				mat = args.slice(1).join(" ");
				current = "MAT_MODEL_" + mat + "__" + mat_index++;

			} else if (args[0] == "v") {
				verts.push([parseFloat(args[1]), parseFloat(args[2]), parseFloat(args[3])]);

			} else if (args[0] == "vn") {
				norms.push([parseFloat(args[1]), parseFloat(args[2]), parseFloat(args[3])]);

			} else if (args[0] == "vt") {
				// In OBJ, V is typically flipped. So unflip
				texts.push([parseFloat(args[1]), 1 - parseFloat(args[2])]);

			} else if (current && args[0] == "f") {
				let slice = args.slice(1);

				// Subtract 1 to shift to 0 index
				let vs  = slice.map(x => verts[parseFloat(x.split("/")[0]) - 1]);
				let uvs = slice.map(x => texts[parseFloat(x.split("/")[1]) - 1]).filter(x => x != undefined);
				let ns  = slice.map(x => norms[parseFloat(x.split("/")[2]) - 1]).filter(x => x != undefined);

				// if (current != Model.FULL_OBJ) result.add_face(Model.FULL_OBJ, vs, uvs, ns);
				result.add_face(current, mat, vs, uvs, ns);
			}
		}

		return result;
	}

	constructor(vertices: Array<number> = [], normals: Array<number> = [], textures: Array<number> = [], materials: Indexable<material_options> = {}) {
		this.vertices = {};
		this.normals  = {};
		this.textures = {};

		this.vertices[Model.FULL_OBJ] = vertices;
		this.normals[Model.FULL_OBJ] = normals;
		this.textures[Model.FULL_OBJ] = textures;

		this.materials = materials;
		this.materials[Model.DEFAULT_MATERIAL] = materials[Model.DEFAULT_MATERIAL] ? materials[Model.DEFAULT_MATERIAL] : {};

		this.mat_map = {};
		this.mat_map[Model.FULL_OBJ] = Model.DEFAULT_MATERIAL;
	}

	add_face(obj_name: string, mat_name: string, vs: Array<Array<number>>, uvs: Array<Array<number>>, ns: Array<Array<number>>) {
		// Create the index array if needed
		if (!this.vertices[obj_name]) {
			this.vertices[obj_name] = [...vs[0], ...vs[1], ...vs[2]];

			this.textures[obj_name] = (uvs.length ? [...uvs[0], 0, ...uvs[1], 0, ...uvs[2], 0] : []);
			this.normals[obj_name]  = (ns.length ? [...ns[0], ...ns[1], ...ns[2]] : []);
		} else {
			this.vertices[obj_name].push(...vs[0], ...vs[1], ...vs[2]);

			if (uvs.length) this.textures[obj_name].push(...uvs[0], 0, ...uvs[1], 0, ...uvs[2], 0);
			if (ns.length)  this.normals[obj_name].push(...ns[0], ...ns[1], ...ns[2]);
		}

		// Update the bounds
		for (let i = 0; i != 3; ++i) {
			this.update_bounds(Model.FULL_OBJ, vs[i][0], vs[i][1], vs[i][2]); // Global object info
			this.update_bounds(obj_name, vs[i][0], vs[i][1], vs[i][2]); // Named-object info
		}

		// Update the mat
		if (!this.mat_map[obj_name]) {
			this.mat_map[obj_name] = mat_name;
		}
	}

	add_materials(mat: string, parent: string) {
		let lines = mat.split("\n");

		let current = Model.DEFAULT_MATERIAL;
		lines.forEach(line => {
			let args = line.replace(/\s+/g, " ").split(" ");

			if (args[0] == "newmtl") {
				current = args[1];
				this.materials[current] = {};

			} else if (args[0] == "Kd") {
				this.materials[current].color = [...args.slice(1).map(x => 255 * parseFloat(x)), 255];

			} else if (args[0] == "map_Kd") {
				this.materials[current].url = parent + args[1];

			}
		});
	}

	get_material_for_context(ctx: Context, obj_name: string) {
		return ctx.get_material(this, this.mat_map[obj_name], this.materials[this.mat_map[obj_name]]);
	}

	get_materials_for_context(ctx: Context) {
		return Object.keys(this.vertices).map(x => this.get_material_for_context(ctx, x));
	}

	// Draw an item (or all)
	draw(ctx: Context, options: model_options, obj_name: string = "") {
		if (obj_name.length == 0) {
			Object.keys(this.vertices).forEach(group => this.do_draw(ctx, options, group));
		} else {
			this.do_draw(ctx, options, obj_name);
		}
	}

	update_bounds(obj_name: string, x: number, y: number, z: number) {
		if (!this.bounds[obj_name]) {
			this.bounds[obj_name] = {
				x: new BoundInfo(x),
				y: new BoundInfo(y),
				z: new BoundInfo(z)
			};
		} else {
			// Update the various bounds
			this.bounds[obj_name].x.update(x);
			this.bounds[obj_name].y.update(y);
			this.bounds[obj_name].z.update(z);
		}
	}

	private do_draw(ctx: Context, options: model_options, obj_name: string) {
		// Get necessary info from the model
		let obj_group = obj_name;

		// Assert that group exists
		if (!this.vertices[obj_group])
			throw new ModelError(`Invalid Object name specified for model: ${obj_group}`);

		// Skip empty groups
		if (this.vertices[obj_group].length == 0)
			return;

		let data_buffer = ctx.get_buffer(this, false, "model_" + obj_group + "_faces");
		let material = ctx.get_material(this, this.mat_map[obj_group], this.materials[this.mat_map[obj_group]]);

		// Initialize the buffers if empty
		if (data_buffer.value.length == 0) {
			let combined: Array<number> = [];

			// Combine vertex, texture, and normal info
			for (let i = 0; i != this.vertices[obj_group].length; i += 3) {
				combined.push(...this.vertices[obj_group].slice(i, i + 3));
				combined.push(...this.textures[obj_group].slice(i, i + 2));
				combined.push(...this.normals[obj_group].slice(i, i + 3));
			}

			data_buffer.value = combined;
		}

		// Stride stuff
		let vertex_width = 3;
		let texture_width = (this.textures[obj_group].length ? 2 : 0);
		let normal_width  = (this.normals[obj_group].length ? 3 : 0);

		let stride = vertex_width + texture_width + normal_width;

		// Set up pointers
		data_buffer.bind();
		options.position.enable({
			stride: stride,
			offset: 0,
			normalize: false
		});

		if (options.texture) {
			ctx.gl.activeTexture(ctx.gl.TEXTURE0);
			material.bind();

			options.texture.enable({
				stride: stride,
				offset: vertex_width,
				normalize: false
			});
		}

		if (options.normal) {
			options.normal.enable({
				stride: stride,
				offset: vertex_width + texture_width,
				normalize: false
			});
		}

		// Draw the element
		ctx.gl.drawArrays(ctx.gl.TRIANGLES, 0, data_buffer.value.length / stride);

		options.position.disable();
		if (options.texture) options.texture.disable();
		if (options.normal) options.normal.disable();
	}
}