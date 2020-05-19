attribute vec3 pos;
attribute vec2 uvs;
attribute vec3 nor;

uniform mat4 M;
uniform mat4 V;
uniform mat4 P;

varying highp vec2 UV0;
varying vec3 Norm0;

void main() {
	gl_Position = P * V * M * vec4(pos, 1.0);

	// Pass info to fragment
	UV0   = uvs;
	Norm0 = nor;
}