import axios from 'axios';

export async function extractFile(file) {
  const form = new FormData();
  form.append('files', file);
  const { data } = await axios.post('/api/extract', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.results[0];
}

export async function exportRows(rows) {
  const response = await axios.post('/api/export', { rows }, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Library_Requirement.xlsx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
