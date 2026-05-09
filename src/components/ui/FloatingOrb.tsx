"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function FloatingOrb({ index }: { index: number }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // Shape based on index
    const shapes = [
      new THREE.IcosahedronGeometry(1.8, 3),
      new THREE.OctahedronGeometry(1.8, 2),
      new THREE.TorusGeometry(1.4, 0.5, 16, 40),
      new THREE.DodecahedronGeometry(1.6, 1),
    ];
    const geo = shapes[index % shapes.length];

    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });

    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.04,
      side: THREE.FrontSide,
    });

    const mesh = new THREE.Mesh(geo, mat);
    const innerMesh = new THREE.Mesh(geo.clone(), innerMat);
    scene.add(mesh);
    scene.add(innerMesh);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    const pointLight = new THREE.PointLight(0xffffff, 1.5, 20);
    pointLight.position.set(3, 3, 3);
    scene.add(ambientLight, pointLight);

    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 0.5;
    };
    window.addEventListener("mousemove", onMouseMove);

    let animId: number;
    let t = 0;
    const speed = 0.004 + index * 0.002;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += speed;
      mesh.rotation.x = t * 0.7 + mouseY;
      mesh.rotation.y = t + mouseX;
      innerMesh.rotation.x = -t * 0.5;
      innerMesh.rotation.y = -t * 0.7;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [index]);

  return <div ref={mountRef} className="w-full h-full" />;
}
