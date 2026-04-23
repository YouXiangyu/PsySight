import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { getMe, updateMyProfile } from '@/lib/api';
import { profileCopy } from '@/shared/copy/app-copy';
import type { NoticeState } from '@/shared/ui/request-state';
import { getErrorMessage } from '@/shared/ui/request-state';

export function useProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [publicName, setPublicName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [region, setRegion] = useState('');
  const [showNickname, setShowNickname] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const reloadProfile = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const me = await getMe();
      setAuthenticated(me.authenticated);

      if (!me.authenticated || !me.user) {
        return;
      }

      setUsername(me.user.username || '');
      setPublicName(me.user.public_name || '');
      setGender(me.user.gender || '');
      setAge(me.user.age ? String(me.user.age) : '');
      setRegion(me.user.region || '');
      setShowNickname(Boolean(me.user.show_nickname_in_stats));
    } catch (error) {
      setErrorMsg(getErrorMessage(error, profileCopy.fallbackErrors.load));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadProfile();
  }, [reloadProfile]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    setErrorMsg('');

    try {
      const response = await updateMyProfile({
        gender: gender || null,
        age: age ? Number(age) : null,
        region: region || null,
        show_nickname_in_stats: showNickname,
      });

      setPublicName(response.user.public_name || '');
      setNotice({ tone: 'success', ...profileCopy.saveSuccess });
    } catch (error) {
      setErrorMsg(getErrorMessage(error, profileCopy.fallbackErrors.save));
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    authenticated,
    username,
    publicName,
    gender,
    age,
    region,
    showNickname,
    notice,
    errorMsg,
    setGender,
    setAge,
    setRegion,
    setShowNickname,
    handleSubmit,
    reloadProfile,
  };
}
