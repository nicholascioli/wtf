const FRAGMENT = 0;
const VERTEX = 1;

window.onload = async () => {
	try {
		// Get the context and shader
		let ctx = new wtf.Context();
		ctx.gl.clearColor(0, 0, 0, 1);

		let per_fragment = await wtf.ShaderProgram.fromUrl(ctx, "lighting_per_fragment.v.glsl", "lighting_per_fragment.f.glsl");
		let per_vertex = await wtf.ShaderProgram.fromUrl(ctx, "lighting_per_vertex.v.glsl", "lighting_per_vertex.f.glsl");
		let pointer_prog = await wtf.ShaderProgram.fromUrl(ctx, "simple.v.glsl", "simple.f.glsl");

		let current = per_fragment;

		// Model
		let quad = new wtf.Model([
			-1, -1, 0,
			 1,  1, 0,
			-1,  1, 0,
			-1, -1, 0,
			 1, -1, 0,
			 1,  1, 0,
			-1, -1, 0
		], [
			0, 0, 1,
			0, 0, 1,
			0, 0, 1,
			0, 0, 1,
			0, 0, 1,
			0, 0, 1
		]);

		// MVP
		let ratio = ctx.gl.canvas.clientWidth / ctx.gl.canvas.clientHeight;
		let eye = vec3(0, 2, 2);
		let view = lookAt(eye, vec3(0, 0, 0), vec3(0, 0, -1));
		let persp = perspective(60, ratio, 0.1, 100);
		let model = mult(rotate(-90, [1, 0, 0]), scalem(1.0, 1.0, 1.0));

		// Lighting
		let light_pos = [0, 0.5, 0];
		let position = [0, 0];

		// Toggling
		window.switch_to = (to) => {
			switch (to) {
				case (FRAGMENT):
					current = per_fragment;
					break;
				case (VERTEX):
					current = per_vertex;
					break;
			}

			render();
		};

		let render = () => {
			ctx.gl.clear(ctx.gl.COLOR_BUFFER_BIT | ctx.gl.DEPTH_BUFFER_BIT);

			// Set uniforms
			current.use();
			current.uniforms.V.value = flatten(view);
			current.uniforms.P.value = flatten(persp);
			current.uniforms.InverseM.value = flatten(transpose(inverse(model)));

			current.uniforms.color.value = [1, 1, 1];
			current.uniforms.light_pos.value = light_pos;
			current.uniforms.light_inner_dot.value = 0.6;
			current.uniforms.light_outer_dot.value = 0.2;

			current.uniforms.light_dir.value = [position[0] - light_pos[0], -light_pos[1], position[1] - light_pos[2]];

			let scale = 1.0 / divisor;
			let center_x = (1.0 - divisor) / divisor;
			let m = mult(scalem(scale, 1.0, scale), model);
			for (let i = 0; i != divisor; ++i) {
				let center_z = (1.0 - divisor) / divisor;

				for (let j = 0; j != divisor; ++j) {
					current.uniforms.M.value = flatten(mult(translate(center_x + 2 * i * scale, 0, center_z + 2 * j * scale), m));
					quad.draw(ctx, {
						position: per_fragment.attribs.pos,
						normal: per_fragment.attribs.nor
					});
				}
			}

			// Draw the pointer
			pointer_prog.use();
			pointer_prog.uniforms.V.value = flatten(view);
			pointer_prog.uniforms.P.value = flatten(persp);
			pointer_prog.uniforms.M.value = flatten(
				mult(
					mult(
						translate([position[0] - light_pos[0], 0.01, position[1] - light_pos[2]]),
						scalem(0.05, 0.05, 0.05)
					),
					model
				)
			);
			pointer_prog.uniforms.color.value = [1, 0, 0];
			quad.draw(ctx, {
				position: pointer_prog.attribs.pos,
				normal: pointer_prog.attribs.nor
			});
		};

		// Input
		let divisor = 1;
		window.change_divisor = () => {
			let value = document.getElementById("division").value;

			document.getElementById("division-value").innerText = value;
			divisor = value;
			render();
		}
		window.change_divisor();

		let delta = 0.05;
		let bound = 0.9;
		window.onkeydown = (e) => {
			if (e.key == "ArrowUp")
				position[1] -= delta;
			else if (e.key == "ArrowDown")
				position[1] += delta;
			else if (e.key == "ArrowRight")
				position[0] += delta;
			else if (e.key == "ArrowLeft")
				position[0] -= delta;

			position[0] = Math.min(Math.max(-bound, position[0]), bound);
			position[1] = Math.min(Math.max(-bound, position[1]), bound);

			render();
		}
	} catch (e) {
		console.error(e);
	}
}