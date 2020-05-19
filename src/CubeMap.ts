import { Material, material_options } from "./Material";
import { Model, model_options } from "./Model";
import { Context } from "./Context";
import { ShaderProgram } from "./ShaderProgram";
import { Indexable } from "./Indexable";

export interface cube_map_faces {
	pos_x: string,
	pos_y: string,
	pos_z: string,

	neg_x: string,
	neg_y: string,
	neg_z: string
};

export class CubeMap {
	model: Model;
	vertex_source: string;
	fragment_source: string;

	materials: Indexable<material_options> = {};

	constructor(faces: cube_map_faces, ) {
		const fs = [
			{ target: WebGLRenderingContext.TEXTURE_CUBE_MAP_POSITIVE_X, name: "pos_x" },
			{ target: WebGLRenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_X, name: "neg_x" },
			{ target: WebGLRenderingContext.TEXTURE_CUBE_MAP_POSITIVE_Y, name: "pos_y" },
			{ target: WebGLRenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_Y, name: "neg_y" },
			{ target: WebGLRenderingContext.TEXTURE_CUBE_MAP_POSITIVE_Z, name: "pos_z" },
			{ target: WebGLRenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_Z, name: "neg_z" }
		];

		// Get material options for the cube map
		this.materials[Model.DEFAULT_MATERIAL] = {
			target: WebGLRenderingContext.TEXTURE_CUBE_MAP
		};

		// Add the faces
		for (let i = 0; i != fs.length; ++i) {
			let key  = fs[i].name;
			let type = fs[i].target
			let url  = (<any>faces)[key]; // FIXME: Make nicer

			this.materials["CUBE_MAP_FACE_" + key] = {
				handle: (ctx: Context) => this.model.get_material_for_context(ctx, Model.FULL_OBJ).handle,

				url: url,
				target: WebGLRenderingContext.TEXTURE_CUBE_MAP,
				dataTarget: type
			};
		}

		// Initialize the model
		this.model = new Model([
			-1, -1, 1,
			 1, -1, 1,
			-1,  1, 1,
			-1,  1, 1,
			 1, -1, 1,
			 1,  1, 1,
		], [], [], this.materials);

		// Generate the shader program
		this.vertex_source = `
			attribute vec3 pos;

			varying vec4 Pos0;

			void main() {
				gl_Position = vec4(pos.xy, 0.99999, 1.0);
				Pos0 = gl_Position;
			}
		`;

		this.fragment_source = `
			precision mediump float;

			varying vec4 Pos0;

			uniform samplerCube skybox;
			uniform mat4 inverse_view;

			void main() {
				vec4 t = inverse_view * Pos0;
				gl_FragColor = textureCube(skybox, normalize(t.xyz / t.w));
			}
		`;
	}

	draw(ctx: Context, inverse_view: Array<number>) {
		// Get old binding
		let old = ctx.gl.getParameter(ctx.gl.CURRENT_PROGRAM);

		// Just in case, initialize the textures
		Object.keys(this.materials).forEach(mat_name => {
			let mat_opts = this.materials[mat_name];

			let mat = ctx.get_material(this.model, mat_name, mat_opts);
			if (mat_name != Model.DEFAULT_MATERIAL)
				mat.generate();
		});

		// Get the shader
		let sha = ctx.get_program(this, "main_shader", this.vertex_source, this.fragment_source);
		sha.use();

		// Set shader values
		sha.uniforms.inverse_view.value = <any>inverse_view;
		sha.uniforms.skybox.value = <any>0;

		// Draw the model
		this.model.draw(ctx, {
			position: sha.attribs.pos
		});

		sha.unuse();

		ctx.gl.useProgram(old);
	}
};