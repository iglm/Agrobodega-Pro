
import { User } from '../types';

/**
 * Servicio para interactuar con la API de Google Drive.
 * Permite centralizar documentos físicos en una carpeta específica de la finca.
 */
export const driveService = {
  /**
   * Sube un archivo a Google Drive en la carpeta de la aplicación.
   * Requiere scope: https://www.googleapis.com/auth/drive.file
   */
  async uploadFileToDrive(file: File, accessToken: string, folderId?: string): Promise<{ id: string; webViewLink: string }> {
    try {
      const metadata = {
        name: file.name,
        mimeType: file.type,
        parents: folderId ? [folderId] : []
      };

      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', file);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error al subir archivo a Google Drive');
      }

      return await response.json();
    } catch (error) {
      console.error("[Drive Service] Error:", error);
      throw error;
    }
  },

  /**
   * Crea o busca la carpeta principal de AgroBodega
   */
  async getOrCreateAppFolder(accessToken: string): Promise<string> {
    const folderName = 'AgroBodega_Documentos';
    
    // Buscar si existe
    const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const searchResult = await searchResponse.json();
    if (searchResult.files && searchResult.files.length > 0) {
      return searchResult.files[0].id;
    }

    // Crear si no existe
    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });

    const createResult = await createResponse.json();
    return createResult.id;
  }
};
