import { FormEvent, useEffect, useState } from 'react';
import { getMe, updateMyProfile } from '@/lib/api';

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
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const me = await getMe();
        setAuthenticated(me.authenticated);
        if (!me.authenticated || !me.user) return;
        setUsername(me.user.username || '');
        setPublicName(me.user.public_name || '');
        setGender(me.user.gender || '');
        setAge(me.user.age ? String(me.user.age) : '');
        setRegion(me.user.region || '');
        setShowNickname(Boolean(me.user.show_nickname_in_stats));
      } catch (error) {
        setErrorMsg((error as Error).message || '加载个人资料失败');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setErrorMsg('');
    try {
      const response = await updateMyProfile({
        gender: gender || null,
        age: age ? Number(age) : null,
        region: region || null,
        show_nickname_in_stats: showNickname,
      });
      setPublicName(response.user.public_name || '');
      setMessage('资料已更新');
    } catch (error) {
      setErrorMsg((error as Error).message || '保存失败');
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
    message,
    errorMsg,
    setGender,
    setAge,
    setRegion,
    setShowNickname,
    handleSubmit,
  };
}
