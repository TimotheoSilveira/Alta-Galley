import streamlit as st
import json
import base64
from pathlib import Path
from datetime import datetime
import os
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import gdown

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

st.set_page_config(
    page_title="Alta Gallery",
    page_icon="🐄",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CONFIGURAÇÃO DO GOOGLE DRIVE
GOOGLE_DRIVE_FOLDER_ID = "1234567890abcdefg"  # SUBSTITUA PELO SEU ID
SCOPES = ['https://www.googleapis.com/auth/drive']

# ============================================================================
# DADOS INICIAIS
# ============================================================================

INITIAL_BULLS = [
    {
        "id": 1,
        "name": "Super Bull 001",
        "code": "SB001",
        "breed": "Holandês",
        "category": "Leite",
        "description": "Excelente produção de leite e conformação.",
        "bullImage": "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
        "daughters": [
            {
                "id": 101,
                "cowName": "Vaca 4021",
                "farm": "Fazenda Boa Vista",
                "location": "Varginha / MG",
                "milk": "42 kg/dia",
                "lactation": "2ª lactação",
                "image": "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1200&q=80"
            },
            {
                "id": 102,
                "cowName": "Estrela 198",
                "farm": "Fazenda Santa Clara",
                "location": "Carmo do Rio Claro / MG",
                "milk": "38 kg/dia",
                "lactation": "1ª lactação",
                "image": "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80"
            }
        ]
    },
    {
        "id": 2,
        "name": "Alta Prime 245",
        "code": "AP245",
        "breed": "Jersey",
        "category": "Sólidos",
        "description": "Destaque para sólidos, fertilidade e vacas funcionais.",
        "bullImage": "https://images.unsplash.com/photo-1493962853295-0fd70327578a?auto=format&fit=crop&w=900&q=80",
        "daughters": []
    },
    {
        "id": 3,
        "name": "Lineage Force 990",
        "code": "LF990",
        "breed": "Girolando",
        "category": "Tropical",
        "description": "Boa adaptação, persistência e excelente tipo leiteiro.",
        "bullImage": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
        "daughters": []
    }
]

# ============================================================================
# INICIALIZAR SESSION STATE
# ============================================================================

if "bulls" not in st.session_state:
    st.session_state.bulls = []
    st.session_state.query = ""
    st.session_state.breedFilter = "Todas as raças"
    st.session_state.selectedBullId = None
    st.session_state.previewPhoto = None
    st.session_state.showAddBull = False
    st.session_state.showAddPhoto = False

# ============================================================================
# FUNÇÕES DO GOOGLE DRIVE
# ============================================================================

def get_drive_service():
    """Retorna serviço do Google Drive (sem autenticação para leitura pública)"""
    try:
        # Para leitura pública, usamos gdown que não precisa de autenticação
        return True
    except:
        return False

def upload_to_google_drive(file_content, filename, folder_id=GOOGLE_DRIVE_FOLDER_ID):
    """
    Faz upload de arquivo para Google Drive
    Requer arquivo de credenciais JSON (service account)
    """
    try:
        # Se você tiver um arquivo credentials.json, descomente:
        # credentials = Credentials.from_service_account_file('credentials.json', scopes=SCOPES)
        # service = build('drive', 'v3', credentials=credentials)

        # Por enquanto, retorna URL base64 (alternativa simples)
        file_base64 = base64.b64encode(file_content).decode()
        return f"data:image/png;base64,{file_base64}"
    except Exception as e:
        st.error(f"Erro ao fazer upload: {str(e)}")
        return None

def get_google_drive_image_url(file_id):
    """Retorna URL pública do Google Drive para uma imagem"""
    return f"https://drive.google.com/uc?export=view&id={file_id}"

# ============================================================================
# FUNÇÕES DE ARMAZENAMENTO LOCAL
# ============================================================================

def load_bulls():
    if Path("bulls_data.json").exists():
        with open("bulls_data.json", "r", encoding="utf-8") as f:
            return json.load(f)
    return INITIAL_BULLS.copy()

def save_bulls():
    with open("bulls_data.json", "w", encoding="utf-8") as f:
        json.dump(st.session_state.bulls, f, indent=2, ensure_ascii=False)

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

def get_breeds():
    breeds = set(bull["breed"] for bull in st.session_state.bulls)
    return ["Todas as raças"] + sorted(list(breeds))

def get_filtered_bulls():
    filtered = []
    for bull in st.session_state.bulls:
        haystack = f"{bull['name']} {bull['code']} {bull.get('category', '')} {bull['breed']}".lower()
        matches_query = st.session_state.query.lower() in haystack
        matches_breed = (st.session_state.breedFilter == "Todas as raças" or 
                        bull["breed"] == st.session_state.breedFilter)
        if matches_query and matches_breed:
            filtered.append(bull)
    return filtered

def get_selected_bull():
    for bull in st.session_state.bulls:
        if bull["id"] == st.session_state.selectedBullId:
            return bull
    return None

# ============================================================================
# CARREGAR DADOS
# ============================================================================

if not st.session_state.bulls:
    st.session_state.bulls = load_bulls()

# ============================================================================
# GALERIA PÚBLICA
# ============================================================================

col1, col2, col3 = st.columns([2, 3, 2])

with col1:
    st.markdown("### 🐄 Alta Gallery")

st.divider()

st.markdown("## Touros Cadastrados")
st.markdown("Conheça os touros Alta Genetics e a progênie deles.")

col1, col2, col3 = st.columns(3)
total_photos = sum(len(bull.get("daughters", [])) for bull in st.session_state.bulls)
breeds_count = len(get_breeds()) - 1

with col1:
    st.metric("Touros", len(st.session_state.bulls))
with col2:
    st.metric("Raças", max(breeds_count, 0))
with col3:
    st.metric("Fotos", total_photos)

st.divider()

col1, col2 = st.columns([3, 1])

with col1:
    st.session_state.query = st.text_input(
        "Buscar por nome ou código do touro",
        value=st.session_state.query,
        placeholder="Digite para filtrar..."
    )

with col2:
    st.session_state.breedFilter = st.selectbox(
        "Raça",
        get_breeds(),
        index=0
    )

st.divider()

filtered_bulls = get_filtered_bulls()

if not filtered_bulls:
    st.info("Nenhum touro encontrado com esse filtro.")
else:
    st.markdown(f"### {len(filtered_bulls)} resultado(s)")

    for bull in filtered_bulls:
        col1, col2, col3 = st.columns([1, 3, 1])

        with col1:
            if bull.get("bullImage"):
                st.image(bull["bullImage"], use_column_width=True)
            else:
                st.info("Sem foto")

        with col2:
            st.markdown(f"### {bull['name']}")
            st.markdown(f"**Código:** {bull['code']}")
            st.markdown(f"**Raça:** {bull['breed']} | **Categoria:** {bull.get('category', 'N/A')}")
            st.markdown(f"**Descrição:** {bull.get('description', 'Sem descrição genética cadastrada.')}")
            st.markdown(f"**Fotos de filhas:** {len(bull.get('daughters', []))}")

        with col3:
            if st.button("Ver galeria", key=f"open_{bull['id']}"):
                st.session_state.selectedBullId = bull["id"]
                st.rerun()

        st.divider()

# ============================================================================
# GALERIA DO TOURO
# ============================================================================

selected_bull = get_selected_bull()
if selected_bull:
    st.markdown(f"## Galeria - {selected_bull['name']} ({selected_bull['code']})")

    col1, col2 = st.columns([1, 3])
    with col1:
        if selected_bull.get("bullImage"):
            st.image(selected_bull["bullImage"], use_column_width=True)
        else:
            st.info("Sem foto")

    with col2:
        st.markdown(f"**Raça:** {selected_bull['breed']}")
        st.markdown(f"**Categoria:** {selected_bull.get('category', 'N/A')}")
        st.markdown(f"**Descrição:** {selected_bull.get('description', 'Sem descrição')}")

    if st.button("Fechar galeria"):
        st.session_state.selectedBullId = None
        st.rerun()

    st.divider()

    # Fotos das filhas
    if selected_bull.get("daughters"):
        st.markdown(f"### Fotos de filhas ({len(selected_bull['daughters'])})")

        cols = st.columns(3)
        for idx, photo in enumerate(selected_bull["daughters"]):
            with cols[idx % 3]:
                st.image(photo["image"], use_column_width=True)
                st.markdown(f"**{photo['cowName']}**")
                st.markdown(f"{photo.get('farm', '-')} | {photo.get('location', '-')}")
                if photo.get("milk"):
                    st.markdown(f"Produção: {photo['milk']}")
                if photo.get("lactation"):
                    st.markdown(f"Lactação: {photo['lactation']}")

                if st.button("Ampliar", key=f"preview_{photo['id']}"):
                    st.session_state.previewPhoto = photo
                    st.rerun()
    else:
        st.info("Nenhuma foto cadastrada para este touro ainda.")

# ============================================================================
# VISUALIZAÇÃO DE FOTO
# ============================================================================

if st.session_state.previewPhoto:
    photo = st.session_state.previewPhoto
    st.markdown(f"## Visualização - {photo['cowName']}")
    st.image(photo["image"], use_column_width=True)

    col1, col2, col3 = st.columns(3)
    with col1:
        st.markdown(f"**Vaca:** {photo['cowName']}")
    with col2:
        st.markdown(f"**Fazenda:** {photo.get('farm', '-')}")
    with col3:
        st.markdown(f"**Local:** {photo.get('location', '-')}")

    if photo.get("milk"):
        st.markdown(f"**Produção:** {photo['milk']}")
    if photo.get("lactation"):
        st.markdown(f"**Lactação:** {photo['lactation']}")

    if st.button("Fechar visualização"):
        st.session_state.previewPhoto = None
        st.rerun()

# ============================================================================
# SIDEBAR - INFORMAÇÕES
# ============================================================================

with st.sidebar:
    st.markdown("### 📋 Informações")
    st.markdown(f"**Total de touros:** {len(st.session_state.bulls)}")
    st.markdown(f"**Total de fotos:** {total_photos}")
    st.markdown(f"**Raças cadastradas:** {breeds_count}")

    st.divider()

    st.markdown("### 🔧 Configuração Google Drive")
    st.markdown(f"**ID da Pasta:** `{GOOGLE_DRIVE_FOLDER_ID}`")
    st.markdown("[Abrir Google Drive](https://drive.google.com/drive/folders/{}?usp=sharing)".format(GOOGLE_DRIVE_FOLDER_ID))
