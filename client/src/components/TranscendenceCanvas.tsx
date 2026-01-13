import { useEffect, useRef } from 'react';

export function TranscendenceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext;
    if (!gl) return;

    // Resize canvas
    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Vertex shader
    const vertexShaderSource = `
      precision mediump float;
      attribute vec2 a_position;
      uniform vec2 u_resolution;
      uniform float u_time;
      varying vec2 v_uv;
      
      void main() {
          v_uv = a_position;
          vec2 position = a_position;
          
          // Add wave distortion
          position.y += sin(position.x * 10.0 + u_time * 2.0) * 0.02;
          position.x += cos(position.y * 8.0 + u_time * 1.5) * 0.02;
          
          vec2 clipSpace = ((position / u_resolution) * 2.0 - 1.0) * vec2(1, -1);
          gl_Position = vec4(clipSpace, 0, 1);
      }
    `;

    // Fragment shader
    const fragmentShaderSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform vec2 u_resolution;
      varying vec2 v_uv;
      
      void main() {
          vec2 st = v_uv / u_resolution;
          vec2 mouse = u_mouse / u_resolution;
          
          // Create flowing energy lines
          float energy = 0.0;
          for(float i = 0.0; i < 5.0; i++) {
              vec2 pos = vec2(
                  sin(u_time * 0.5 + i * 1.5) * 0.3 + 0.5,
                  cos(u_time * 0.7 + i * 2.1) * 0.3 + 0.5
              );
              float dist = distance(st, pos);
              energy += 0.01 / (dist + 0.01);
          }
          
          // Mouse interaction
          float mouseDist = distance(st, mouse);
          float mouseGlow = 0.05 / (mouseDist + 0.05);
          
          // Transcendence gradient
          vec3 color1 = vec3(0.0, 0.6, 1.0);  // Trust blue
          vec3 color2 = vec3(0.0, 1.0, 0.933); // Transcendence cyan
          vec3 color3 = vec3(0.0, 1.0, 0.667); // Success green
          
          vec3 finalColor = mix(color1, color2, st.x + sin(u_time) * 0.1);
          finalColor = mix(finalColor, color3, st.y + cos(u_time * 0.8) * 0.1);
          
          // Combine everything
          finalColor += energy * 0.3;
          finalColor += mouseGlow * vec3(0.2, 0.8, 1.0);
          
          // Grid overlay
          float grid = step(0.98, sin(st.x * 50.0)) + step(0.98, sin(st.y * 50.0));
          finalColor += grid * 0.05;
          
          // Fade edges
          float fade = 1.0 - distance(st, vec2(0.5, 0.5)) * 1.5;
          fade = clamp(fade, 0.0, 1.0);
          
          gl_FragColor = vec4(finalColor * fade * 0.3, 1.0);
      }
    `;

    // Compile shader
    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Set up geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    const positions = [
      0, 0,
      canvas.width, 0,
      0, canvas.height,
      0, canvas.height,
      canvas.width, 0,
      canvas.width, canvas.height,
    ];
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse');

    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = canvas.height - (e.clientY - rect.top); // Flip Y for WebGL
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let startTime = Date.now();
    let animationFrameId: number;

    const render = () => {
      const time = (Date.now() - startTime) * 0.001;
      
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, time);
      gl.uniform2f(mouseLocation, mouseX, mouseY);
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
