import React from 'react';
import { useParams } from 'react-router-dom';
import UniteStatsDetailPage from './UniteStatsDetailPage';

const UniteStatsDetailPageWrapper: React.FC = () => {
  const { uniteId, yearId } = useParams();
  if (!uniteId || !yearId) return null;
  return <UniteStatsDetailPage uniteId={uniteId} yearId={yearId} />;
};

export default UniteStatsDetailPageWrapper;
