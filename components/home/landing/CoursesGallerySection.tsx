'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Lock } from 'lucide-react';

type CourseCard = {
  name: string;
  description: string;
  imageSrc: string;
  href?: string;
  locked?: boolean;
  badge?: string;
};

const COURSES: CourseCard[] = [
  {
    name: 'PySpark',
    description: 'Distributed data engineering foundations and practical workflow drills.',
    imageSrc: '/brand/pyspark-logo.svg',
    href: '/learn/pyspark/theory',
    badge: 'Live now'
  },
  {
    name: 'Microsoft Fabric',
    description: 'Lakehouse-first analytics patterns and orchestration in production contexts.',
    imageSrc: '/brand/microsoft-fabric-logo.svg',
    href: '/learn/fabric/theory',
    badge: 'Live now'
  },
  {
    name: 'Apache Airflow',
    description: 'Pipeline scheduling, DAG design, and reliability playbooks.',
    imageSrc: '/brand/apache-airflow-logo.svg',
    href: '/learn/airflow/theory',
    badge: 'Live now'
  }
];

export const CoursesGallerySection = () => {
  return (
    <section id="courses-gallery" className="border-t border-[#242c33] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#a5b0ba]">
            Course Gallery
          </p>
          <h2 className="text-3xl font-bold text-[#e3efe8]" style={{ fontFamily: 'Georgia, serif' }}>
            Pick your track, then start free
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#b0bac4]">
            Start with a live track today. Locked tracks are visible so you know what is coming next.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((course) => {
            const cardBody = (
              <article
                className={`group relative overflow-hidden rounded-2xl border p-5 transition-colors ${
                  course.locked
                    ? 'border-[#343c45] bg-[#0f1318]'
                    : 'border-[#2a323a] bg-[#10151a] hover:border-[#3a434d]'
                }`}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(100,160,220,0.12),transparent_38%)]" />
                <div className="relative flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] ${
                      course.locked
                        ? 'border border-[#454f58] bg-[#1a2129] text-[#9aa6b1]'
                        : 'border border-[#4f5b66] bg-[#232b33] text-[#c5ced6]'
                    }`}
                  >
                    {course.badge}
                  </span>
                  {course.locked ? <Lock className="h-4 w-4 text-grid-text" /> : null}
                </div>

                <div className="relative mt-4 rounded-xl border border-[#2f3840] bg-[#0e1318] p-4">
                  <div className="relative h-28 w-full">
                    <Image
                      src={course.imageSrc}
                      alt={`${course.name} course`}
                      fill
                      className={`object-contain ${course.locked ? 'opacity-55 grayscale' : ''}`}
                    />
                  </div>
                </div>

                <h3 className="relative mt-4 text-xl font-semibold text-[#e3efe8]">{course.name}</h3>
                <p className="relative mt-2 text-sm leading-6 text-[#b0bac4]">{course.description}</p>

                {course.locked ? (
                  <p className="relative mt-3 text-xs text-[#7f8a95]">
                    Coming soon. This course is not available yet.
                  </p>
                ) : (
                  <p className="relative mt-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#c5ced6]">
                    Open track
                  </p>
                )}
              </article>
            );

            return course.locked || !course.href ? (
              <div key={course.name}>{cardBody}</div>
            ) : (
              <Link key={course.name} href={course.href} className="block">
                {cardBody}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
