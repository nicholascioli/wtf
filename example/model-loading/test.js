window.onload = async () => {
	try {
		// Set up the environment
		let ctx = new wtf.Context({antialias: true, preserveDrawingBuffer: true});
		let gl = ctx.gl;

		// Enable depth testing
		gl.enable(gl.DEPTH_TEST);

		// Fix the size
		gl.canvas.width  = gl.canvas.clientWidth;
		gl.canvas.height = gl.canvas.clientHeight;
		gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);

		// MVP
		let ratio = gl.canvas.clientWidth / gl.canvas.clientHeight;
		let eye = vec3(1, 3, 1.5);
		let view = lookAt(eye, vec3(0, 1, 0), vec3(0, 1, 0));
		let persp = perspective(60, ratio, 0.1, 100);

		// Create the program
		let prog = await wtf.ShaderProgram.fromUrl(ctx, "./vertex.glsl", "./fragment.glsl");

		// Use the program
		prog.use();

		prog.uniforms.M.value = flatten(scalem(1, 1, 1));
		prog.uniforms.V.value = flatten(view);
		prog.uniforms.P.value = flatten(persp);

		// Info
		let vdata = [
			-1, -1, 0,
			-1,  1, 0,
			1,  1, 0,
			1, -1, 0
		];

		let ndata = [
			0,  0, 1
		];

		let indices = [
			0, 4,
			2, 4,
			1, 4,
			0, 4,
			3, 4,
			2, 4
		];

		let vbuf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vdata), gl.STATIC_DRAW);

		let nbuf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, nbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ndata), gl.STATIC_DRAW);

		let ibuf = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

		let vpos = prog.attribs.pos.handle;
		let npos = prog.attribs.nor.handle;

		gl.enableVertexAttribArray(vpos);
		gl.enableVertexAttribArray(npos);

		let render = () => {
			// Clear and set shader
			gl.clearColor(0.0, 0.0, 0.0, 1.0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);

			gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
			gl.vertexAttribPointer(vpos, 3, gl.FLOAT, false, 0, 0 * Float32Array.BYTES_PER_ELEMENT);

			// gl.bindBuffer(gl.ARRAY_BUFFER, nbuf);
			gl.vertexAttribPointer(npos, 3, gl.FLOAT, false, 0, 4 * 3 * Float32Array.BYTES_PER_ELEMENT);

			gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0 * Float32Array.BYTES_PER_ELEMENT);

			window.requestAnimationFrame(render);
		};

		render();
	} catch (e) {
		console.error(e);
	}
}