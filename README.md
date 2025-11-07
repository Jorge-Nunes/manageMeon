# Manage API Meon

Esta é uma interface de frontend moderna construída com React e Tailwind CSS para gerenciar instâncias da API [go-whatsapp-web-multidevice](https://github.com/aldinokemal/go-whatsapp-web-multidevice). Ela permite que os usuários configurem a conexão com a API, gerenciem instâncias, gerem QR Codes para login e monitorem o status da conexão em tempo real.

## Arquitetura

A solução completa consiste em duas partes:

1.  **Backend (API Go-WhatsApp):** O servidor `go-whatsapp-web-multidevice` que roda em seu servidor e lida com toda a lógica de comunicação com o WhatsApp.
2.  **Frontend (Este Projeto):** Uma aplicação web estática (React) que fornece uma interface de usuário no navegador para interagir com o backend.

## Passo 1: Deploy do Backend (API Go-WhatsApp)

A maneira recomendada de rodar a API de backend é usando Docker e Docker Compose para facilitar o gerenciamento.

### Pré-requisitos
*   Um servidor (VPS, Dedicado, etc.) com acesso SSH.
*   **Docker** e **Docker Compose** instalados no servidor.

### Instruções

1.  Conecte-se ao seu servidor via SSH.

2.  Crie um diretório para a sua API e navegue até ele:
    ```bash
    mkdir whatsapp-api
    cd whatsapp-api
    ```

3.  Crie um arquivo chamado `docker-compose.yml`:
    ```bash
    nano docker-compose.yml
    ```

4.  Cole o seguinte conteúdo no arquivo. **Preste atenção** às variáveis de ambiente e ajuste-as conforme necessário.

    ```yaml
    version: '3'

    services:
      go-whatsapp:
        image: aldinokemal/go-whatsapp-web-multidevice:latest
        container_name: go-whatsapp-api
        restart: unless-stopped
        ports:
          # Mapeia a porta 8080 do servidor para a porta 8080 do container.
          # Se a porta 8080 já estiver em uso no seu servidor, mude a primeira parte (ex: "8888:8080").
          - "8080:8080"
        environment:
          # --- AUTENTICAÇÃO ---
          # Defina o usuário e a senha para proteger sua API.
          # Você usará essas mesmas credenciais no frontend.
          - APP_USERNAME=seu_usuario_aqui
          - APP_PASSWORD=sua_senha_forte_aqui
        volumes:
          # Este volume garante que os dados da sessão (logins do WhatsApp)
          # sejam mantidos mesmo que o container seja reiniciado.
          - ./sessions:/app/sessions

    volumes:
      sessions:
    ```
    *   **IMPORTANTE:** Substitua `seu_usuario_aqui` e `sua_senha_forte_aqui` por credenciais seguras.

5.  Inicie a API em segundo plano:
    ```bash
    docker-compose up -d
    ```

6.  Verifique se o container está rodando:
    ```bash
    docker ps
    ```
    Você deverá ver um container chamado `go-whatsapp-api` em execução. Seu backend agora está ativo e escutando na porta `8080`.

## Passo 2: Deploy do Frontend (Manage API Meon)

Este frontend é uma aplicação estática. A forma mais robusta de servi-lo é através de um servidor web como Nginx ou Apache.

### Pré-requisitos
*   Um servidor web como **Nginx** instalado.

### Instruções

1.  No seu servidor, crie um diretório para hospedar os arquivos do frontend:
    ```bash
    sudo mkdir -p /var/www/whatsapp-manager
    ```

2.  Copie todos os arquivos deste projeto (`index.html`, `index.tsx`, `App.tsx`, `metadata.json`, `README.md`) para o diretório que você acabou de criar no servidor. Você pode usar `scp` ou um cliente SFTP como o FileZilla.

    Exemplo usando `scp` (execute a partir do seu computador local):
    ```bash
    scp ./* seu_usuario@IP_DO_SERVIDOR:/var/www/whatsapp-manager/
    ```

3.  Configure as permissões corretas no servidor:
    ```bash
    sudo chown -R www-data:www-data /var/www/whatsapp-manager
    sudo chmod -R 755 /var/www/whatsapp-manager
    ```

4.  Crie um arquivo de configuração do Nginx para o seu site:
    ```bash
    sudo nano /etc/nginx/sites-available/whatsapp-manager
    ```

5.  Cole a seguinte configuração. Ela é essencial para que aplicações de página única (SPA) como o React funcionem corretamente.

    ```nginx
    server {
        listen 80;
        server_name SEU_DOMINIO_OU_IP; # Substitua pelo seu domínio ou IP

        root /var/www/whatsapp-manager;
        index index.html;

        location / {
            # Tenta encontrar o arquivo solicitado; se não encontrar, retorna o index.html
            try_files $uri /index.html;
        }
    }
    ```

6.  Ative a configuração e reinicie o Nginx:
    ```bash
    # Crie um link simbólico para ativar o site
    sudo ln -s /etc/nginx/sites-available/whatsapp-manager /etc/nginx/sites-enabled/

    # Teste a sintaxe da configuração
    sudo nginx -t

    # Se o teste for bem-sucedido, reinicie o Nginx para aplicar as alterações
    sudo systemctl restart nginx
    ```

## Passo 3: Acesso e Configuração

1.  **Firewall:** Certifique-se de que as portas `80` (para HTTP/Frontend) e `8080` (para a API/Backend) estão abertas no firewall do seu servidor. Para `ufw`:
    ```bash
    sudo ufw allow 80/tcp
    sudo ufw allow 8080/tcp
    sudo ufw enable
    ```

2.  **Acesse a Aplicação:**
    Abra seu navegador e navegue para `http://SEU_DOMINIO_OU_IP`.

3.  **Configure a Conexão na Interface:**
    *   **Endereço da API:** `http://SEU_DOMINIO_OU_IP:8080`
    *   **Usuário:** `seu_usuario_aqui` (o mesmo que você definiu no `docker-compose.yml`).
    *   **Senha:** `sua_senha_forte_aqui` (a mesma que você definiu no `docker-compose.yml`).
    *   **Nome da Instância:** Escolha um nome para sua sessão (ex: `minha-loja`).

Agora você está pronto para usar a aplicação!
