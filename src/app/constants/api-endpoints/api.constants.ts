const API_URL_LOCAL = 'http://127.0.0.1:5001';
const API_URL_PROD = '';

export const UserApi = {
  BASE_URL: `${API_URL_LOCAL}/user`,
  ENDPOINT: {
    CONVERSATION_OVERVIEW: '/conversation/overview',
    CONVERSATION_TO_DEL: (conversation_id: number) =>
      `/conversations_to_del/${conversation_id}`,
    NEW_CONVERSATION: '/new-conversation/',
    CONNTINUE_CONVERSATION: (conversation_id: number) =>
      `/update-conversation/${conversation_id}`,
    GET_CONVERSATION: (conversation_id: number) =>
      `/conversation/${conversation_id}`,
  },
};

export const AuthApi = {
  BASE_URL: `${API_URL_LOCAL}/auth`,
  ENDPOINT: {
    LOGIN: '/login',
    REGISTRY: '/registry',
    LOGOUT: '/logout',
    REFERSH_TOKEN: '/refresh',
    REVOKE_ACCESS_TOKEN: '/revoke_access',
    REVOKE_REFRESH_TOKEN: '/revoke_refresh',
    RESET_PASSWORD: '/reset_password',
    REQUEST_RESET_PASSWORD: '/request_reset_password',
    CHECK_RESET_PASSWORD_TOKEN: '/check_reset_password_token',
  },
};

export const ModelApi = {
  BASE_URL: `${API_URL_LOCAL}/model`,
  ENDPOINT: {
    PREDICT: (typeModel: string) => `/predict/${typeModel}`,
  },
};
