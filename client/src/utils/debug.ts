/**
 * Utilitários de debug para identificar problemas
 */

export const DEBUG = {
  logSelectData: (componentName: string, data: any[], fieldName: string) => {
    console.log(`[DEBUG] ${componentName} - ${fieldName}:`, data);
    
    // Verifica se há dados com "alias"
    const aliasData = data.filter(item => 
      Object.values(item).some(value => 
        typeof value === 'string' && value.toLowerCase().includes('alias')
      )
    );
    
    if (aliasData.length > 0) {
      console.warn(`[DEBUG] ENCONTRADO "alias" em ${componentName}:`, aliasData);
    }
    
    return data;
  },
  
  logFormData: (componentName: string, formData: any) => {
    console.log(`[DEBUG] ${componentName} - Form Data:`, formData);
    
    // Verifica se há "alias" nos dados do formulário
    const aliasInForm = Object.entries(formData).filter(([key, value]) => 
      typeof value === 'string' && value.toLowerCase().includes('alias')
    );
    
    if (aliasInForm.length > 0) {
      console.warn(`[DEBUG] ENCONTRADO "alias" no formulário ${componentName}:`, aliasInForm);
    }
    
    return formData;
  },
  
  logApiResponse: (endpoint: string, response: any) => {
    console.log(`[DEBUG] API Response - ${endpoint}:`, response);
    
    // Verifica se há "alias" na resposta da API
    const responseString = JSON.stringify(response);
    if (responseString.toLowerCase().includes('alias')) {
      console.warn(`[DEBUG] ENCONTRADO "alias" na resposta da API ${endpoint}:`, response);
    }
    
    return response;
  }
};