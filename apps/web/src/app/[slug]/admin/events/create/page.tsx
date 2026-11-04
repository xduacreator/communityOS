'use client';

import React from 'react';
import EventForm from '../../../../../components/admin/EventForm';

export default function CreateEvent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  return <EventForm slug={slug} />;
}
