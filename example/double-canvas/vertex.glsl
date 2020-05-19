// Vertex Shader
// ----
// Super simple. Just sets the position of the vertices
attribute vec3 pos;

void main() {
	gl_Position = vec4(pos, 1.0);
}