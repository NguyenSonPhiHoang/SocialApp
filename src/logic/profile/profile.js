// Profile logic
export const handleSave = ({ editName, editEmail, editBio, setSaving, setUser, setEditModalVisible }) => {
  if (!editName.trim() || !editEmail.trim()) return;
  setSaving(true);
  setTimeout(() => {
    setUser((prev) => ({
      ...prev,
      name: editName,
      bio: editBio,
      email: editEmail,
    }));
    setEditModalVisible(false);
    setSaving(false);
  }, 1000);
};
