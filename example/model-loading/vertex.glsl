attribute vec3 pos;
attribute vec3 nor;

uniform mat4 M;
uniform mat4 V;
uniform mat4 P;

uniform vec3 light_pos;

varying vec3 Pos0;
varying vec3 Norm0;
varying vec3 Light0;

void main() {
	gl_Position = P * V * M * vec4(pos, 1.0);

	Pos0 = (V * M * vec4(pos, 1.0)).xyz;
	Norm0 = normalize((V * M * vec4(nor, 0.0)).xyz);
	Light0 = (V * vec4(light_pos, 1.0)).xyz;
}