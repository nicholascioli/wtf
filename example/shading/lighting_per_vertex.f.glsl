precision mediump float;

varying vec3 real_color;
varying float selection;

void main() {
	gl_FragColor = vec4(real_color, 1.0);
}