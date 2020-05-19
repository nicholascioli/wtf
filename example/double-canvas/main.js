window.onload = async () => {
	try {
		// Get the contexes
		let left = new wtf.Context({canvas_id: "c1"});
		let right = new wtf.Context({canvas_id: "c2"});

		// Load the program
		let left_prog = await wtf.ShaderProgram.fromUrl(left, "vertex.glsl", "fragment.glsl");
		let right_prog = await wtf.ShaderProgram.fromUrl(right, "vertex.glsl", "fragment.glsl");

		left.gl.clearColor(0, 0, 0, 1.0);
		left.gl.clear(WebGLRenderingContext.COLOR_BUFFER_BIT);

		right.gl.clearColor(1.0, 1.0, 1.0, 1.0);
		right.gl.clear(WebGLRenderingContext.COLOR_BUFFER_BIT);

		// Load the model
		let monkey = await wtf.Model.load_from_file("monkey.obj");

		// Draw the model
		left_prog.use();
		left_prog.uniforms.color.value = [1.0, 1.0, 1.0];
		monkey.draw(left, {
			position: left_prog.attribs.pos
		});

		right_prog.use();
		right_prog.uniforms.color.value = [0.0, 0.0, 0.0];
		monkey.draw(right, {
			position: right_prog.attribs.pos
		});
	} catch (e) {
		console.error(e);
	}
}