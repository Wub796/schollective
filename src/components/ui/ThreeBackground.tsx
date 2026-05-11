"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/*
 * Academic Network Graph — ThreeBackground
 *
 * Visualises Schollective's core concept: students (small bright nodes)
 * connected to verified professors (larger dimmer hub nodes) via glowing
 * edge lines.  A central "hub" node pulses gently and emits orbital rings
 * suggesting institutional reach.
 */

export function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;

    /* ── Scene ──────────────────────────────────────────────────── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, el.clientWidth / el.clientHeight, 0.1, 1000);
    camera.position.z = 38;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    /* ── Background particle field (stars) ──────────────────────── */
    const starCount = 900;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3]     = (Math.random() - 0.5) * 140;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 100;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0x8ecfe8,  // teal-tinted stars
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    /* ── Node helpers ───────────────────────────────────────────── */
    const nodeMaterial = (opacity: number, size: number) =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity,
        wireframe: size > 0.6,          // professors: wireframe sphere
      });

    interface NodeDef {
      mesh: THREE.Mesh;
      baseOpacity: number;
      phase: number;
      orbitAxis?: THREE.Vector3;
      orbitRadius?: number;
      orbitSpeed?: number;
      orbitCenter?: THREE.Vector3;
    }
    const nodes: NodeDef[] = [];

    /* Central hub — represents the Schollective platform */
    const hubGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const hubMat = new THREE.MeshBasicMaterial({ color: 0x4ec9d4, transparent: true, opacity: 0.22, wireframe: true });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.position.set(6, -1, 0);
    scene.add(hub);
    nodes.push({ mesh: hub, baseOpacity: 0.22, phase: 0 });

    /* Orbital rings around hub */
    const ringAngles = [Math.PI / 4, Math.PI / 2.2, Math.PI / 1.4];
    ringAngles.forEach((tilt, i) => {
      const rGeo = new THREE.TorusGeometry(2.4 + i * 0.8, 0.018, 8, 80);
      const rMat = new THREE.MeshBasicMaterial({ color: 0x3d4dc7, transparent: true, opacity: 0.1 + i * 0.03 });
      const ring = new THREE.Mesh(rGeo, rMat);
      ring.position.copy(hub.position);
      ring.rotation.x = tilt;
      ring.rotation.z = tilt * 0.5;
      scene.add(ring);
    });

    /* Professor nodes — larger, placed at meaningful positions */
    const professorPositions: [number, number, number][] = [
      [-8,  4, -2],
      [ 2,  9, -4],
      [18,  3,  0],
      [10, -8, -3],
      [-4, -6,  2],
    ];
    professorPositions.forEach((pos, i) => {
      const geo = new THREE.SphereGeometry(0.55 + Math.random() * 0.25, 12, 12);
      const mat = new THREE.MeshBasicMaterial({ color: 0x6080c8, transparent: true, opacity: 0.18, wireframe: true });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      scene.add(mesh);
      nodes.push({ mesh, baseOpacity: 0.18, phase: i * 1.1 });
    });

    /* Student nodes — small bright dots orbiting professors */
    const studentCount = 22;
    for (let i = 0; i < studentCount; i++) {
      const profNode = nodes[1 + Math.floor(Math.random() * professorPositions.length)];
      const angle = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * 4;
      const geo = new THREE.SphereGeometry(0.14 + Math.random() * 0.1, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0x4ec9d4, transparent: true, opacity: 0.45 + Math.random() * 0.25 });
      const mesh = new THREE.Mesh(geo, mat);
      const center = profNode.mesh.position.clone();
      mesh.position.set(
        center.x + Math.cos(angle) * r,
        center.y + (Math.random() - 0.5) * 3,
        center.z + Math.sin(angle) * r
      );
      scene.add(mesh);
      nodes.push({
        mesh,
        baseOpacity: mat.opacity,
        phase: Math.random() * Math.PI * 2,
        orbitCenter: center,
        orbitRadius: r,
        orbitAxis: new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          1,
          (Math.random() - 0.5) * 0.4
        ).normalize(),
        orbitSpeed: 0.0015 + Math.random() * 0.002,
      });
    }

    /* ── Edge lines between professors and hub ──────────────────── */
    const lineMat = new THREE.LineBasicMaterial({ color: 0x4ec9d4, transparent: true, opacity: 0.09 });
    const allProfMeshes = nodes.slice(1, 1 + professorPositions.length).map(n => n.mesh);

    // Hub → each professor
    allProfMeshes.forEach(prof => {
      const pts = [hub.position.clone(), prof.position.clone()];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      scene.add(new THREE.Line(geo, lineMat.clone()));
    });

    // Professor → professor (partial mesh — every other pair)
    for (let i = 0; i < allProfMeshes.length; i += 2) {
      const next = allProfMeshes[(i + 1) % allProfMeshes.length];
      const pts = [allProfMeshes[i].position.clone(), next.position.clone()];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const m = lineMat.clone();
      m.opacity = 0.04;
      scene.add(new THREE.Line(geo, m));
    }

    /* ── Lights ─────────────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0x3d6aff, 0.7));  // cool blue ambient

    /* ── Mouse parallax ─────────────────────────────────────────── */
    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    /* ── Resize ─────────────────────────────────────────────────── */
    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener("resize", onResize);

    /* ── Animation loop ─────────────────────────────────────────── */
    let animId: number;
    let t = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.005;

      /* Camera parallax */
      targetX += (mouseX * 2.5 - targetX) * 0.035;
      targetY += (mouseY * 1.8 - targetY) * 0.035;
      camera.position.x = targetX;
      camera.position.y = targetY;
      camera.lookAt(scene.position);

      /* Hub pulse */
      (hub.material as THREE.MeshBasicMaterial).opacity = 0.12 + Math.sin(t * 1.2) * 0.06;

      /* Student orbit */
      nodes.forEach(n => {
        if (n.orbitCenter && n.orbitAxis && n.orbitRadius && n.orbitSpeed) {
          const angle = t * n.orbitSpeed * 200 + n.phase;
          // Orbit in the plane perpendicular to orbitAxis — use Rodrigues
          const baseX = Math.cos(angle) * n.orbitRadius;
          const baseZ = Math.sin(angle) * n.orbitRadius;
          n.mesh.position.x = n.orbitCenter.x + baseX;
          n.mesh.position.z = n.orbitCenter.z + baseZ;
          // Subtle opacity breathe
          (n.mesh.material as THREE.MeshBasicMaterial).opacity =
            n.baseOpacity * (0.7 + 0.3 * Math.sin(t * 0.8 + n.phase));
        } else {
          // Professor / hub — gentle float
          (n.mesh.material as THREE.MeshBasicMaterial).opacity =
            n.baseOpacity * (0.8 + 0.2 * Math.sin(t * 0.5 + n.phase));
        }
      });

      /* Slow whole-scene rotation */
      scene.rotation.y = t * 0.018;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
