import { useEffect, useState } from 'react';
import { weighInApi, type WeighIn } from '../api/weighIn';

/** Historique des pesées de l'utilisateur connecté (vide tant qu'il n'est pas chargé). */
export function useWeighIns(isAuthenticated: boolean): WeighIn[] {
  const [weighIns, setWeighIns] = useState<WeighIn[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    weighInApi.getAll().then(setWeighIns).catch(() => {});
  }, [isAuthenticated]);

  return weighIns;
}
