import streamlit as st
import json
import pandas as pd
from datetime import datetime
import base64
from io import BytesIO

# Configuração da página
st.set_page_config(
    page_title="Alta Gallery",
    page_icon="🐄",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS customizado
st.markdown("""
<style>
    .main { padding: 2rem; }
    .stTabs [data-baseweb="tab-list"] button { font-size: 16px; }
</style>
""", unsafe_allow_html=True)

# Inicializar session state
if "bulls" not in st.session_state:
    st.session_state.bulls = [
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
                }
            ]
        }
    ]

if "admin_logged_in" not in st.session_state:
    st.session_state.admin_logged_in = False
    st.session_state.admin_email = ""
    st.session_state.admin_name = ""

# Sidebar - Login do Administrador
with st.sidebar:
    st.markdown("## 🔐 Área do Administrador")

    if not st.session_state.admin_logged_in:
        st.markdown("**Acesso restrito para gerenciar touros**")

        with st.form("admin_login"):
            email = st.text_input("E-mail corporativo", placeholder="seu.nome@altagenetics.com")
            password = st.text_input("Senha", type="password")

            if st.form_submit_button("🔓 Acessar como Admin"):
                if email.endswith("@altagenetics.com") and password:
                    st.session_state.admin_logged_in = True
                    st.session_state.admin_email = email
                    st.session_state.admin_name = email.split("@")[0]
                    st.success("Acesso de administrador concedido!")
                    st.rerun()
                else:
                    st.error("Use um e-mail @altagenetics.com válido")
    else:
        st.success(f"✅ Conectado como: **{st.session_state.admin_name}**")

        if st.button("🚪 Sair do painel admin"):
            st.session_state.admin_logged_in = False
            st.session_state.admin_email = ""
            st.session_state.admin_name = ""
            st.rerun()

# Header principal
st.markdown("# 🐄 Alta Gallery")
st.markdown("Galeria de touros e progênie Alta Genetics")
st.divider()

# Estatísticas (visível para todos)
col1, col2, col3 = st.columns(3)

with col1:
    st.metric("Touros Cadastrados", len(st.session_state.bulls))

with col2:
    breeds = set(bull["breed"] for bull in st.session_state.bulls)
    st.metric("Raças", len(breeds))

with col3:
    total_photos = sum(len(bull["daughters"]) for bull in st.session_state.bulls)
    st.metric("Fotos de Filhas", total_photos)

st.divider()

# Abas principais
if st.session_state.admin_logged_in:
    tab1, tab2, tab3, tab4, tab5 = st.tabs(["📊 Galeria", "➕ Adicionar Touro", "📥 Importar", "📤 Exportar", "⚙️ Gerenciar"])
else:
    tab1 = st.tabs(["📊 Galeria"])[0]

with tab1:
    st.markdown("## Touros Cadastrados")

    # Filtros
    col1, col2 = st.columns([3, 1])

    with col1:
        search_query = st.text_input("🔎 Buscar por nome ou código", "")

    with col2:
        breeds = ["Todas as raças"] + list(set(bull["breed"] for bull in st.session_state.bulls))
        selected_breed = st.selectbox("Filtrar por raça", breeds)

    # Filtrar touros
    filtered_bulls = st.session_state.bulls

    if search_query:
        filtered_bulls = [
            bull for bull in filtered_bulls
            if search_query.lower() in bull["name"].lower() or search_query.lower() in bull["code"].lower()
        ]

    if selected_breed != "Todas as raças":
        filtered_bulls = [bull for bull in filtered_bulls if bull["breed"] == selected_breed]

    # Exibir cards dos touros
    if filtered_bulls:
        for bull in filtered_bulls:
            with st.container(border=True):
                col1, col2 = st.columns([1, 3])

                with col1:
                    st.image(bull["bullImage"], use_container_width=True)

                with col2:
                    st.markdown(f"### {bull['name']}")
                    st.markdown(f"**Código:** {bull['code']} | **Raça:** {bull['breed']}")
                    st.markdown(f"**Categoria:** {bull['category']}")
                    st.markdown(f"*{bull['description']}*")
                    st.markdown(f"**Fotos de filhas:** {len(bull['daughters'])}")

                    if st.button(f"📂 Ver galeria", key=f"open_{bull['id']}"):
                        st.session_state.selected_bull_id = bull["id"]
                        st.rerun()

                    if st.session_state.admin_logged_in:
                        col_edit, col_delete = st.columns(2)
                        with col_edit:
                            if st.button(f"✏️ Editar", key=f"edit_{bull['id']}"):
                                st.session_state.edit_bull_id = bull["id"]
                                st.rerun()
                        with col_delete:
                            if st.button(f"🗑️ Excluir", key=f"delete_{bull['id']}"):
                                st.session_state.bulls = [b for b in st.session_state.bulls if b["id"] != bull["id"]]
                                st.success("Touro excluído!")
                                st.rerun()
    else:
        st.info("Nenhum touro encontrado com esse filtro.")

    # Visualizar galeria de um touro específico
    if "selected_bull_id" in st.session_state:
        bull = next((b for b in st.session_state.bulls if b["id"] == st.session_state.selected_bull_id), None)

        if bull:
            st.divider()
            st.markdown(f"## Galeria de {bull['name']}")

            if st.button("← Voltar"):
                del st.session_state.selected_bull_id
                st.rerun()

            # Adicionar foto de filha (apenas admin)
            if st.session_state.admin_logged_in:
                if st.button(f"➕ Adicionar foto de filha"):
                    st.session_state.add_photo_bull_id = bull["id"]
                    st.rerun()

            # Exibir fotos das filhas
            if bull["daughters"]:
                cols = st.columns(3)
                for idx, photo in enumerate(bull["daughters"]):
                    with cols[idx % 3]:
                        st.image(photo["image"], use_container_width=True)
                        st.markdown(f"**{photo['cowName']}**")
                        st.markdown(f"🏠 {photo['farm']}")
                        st.markdown(f"📍 {photo['location']}")
                        if photo.get("milk"):
                            st.markdown(f"🥛 {photo['milk']}")

                        col_download, col_delete = st.columns(2)
                        with col_download:
                            st.download_button(
                                "📥 Baixar",
                                data=photo["image"],
                                file_name=f"{photo['cowName']}.jpg",
                                key=f"download_{photo['id']}"
                            )
                        if st.session_state.admin_logged_in:
                            with col_delete:
                                if st.button("🗑️", key=f"delete_photo_{photo['id']}"):
                                    bull["daughters"] = [p for p in bull["daughters"] if p["id"] != photo["id"]]
                                    st.success("Foto excluída!")
                                    st.rerun()
            else:
                st.info("Nenhuma foto cadastrada para este touro.")

# Abas administrativas (apenas para admin)
if st.session_state.admin_logged_in:
    with tab2:
        st.markdown("## Adicionar Novo Touro")

        with st.form("add_bull_form"):
            col1, col2 = st.columns(2)

            with col1:
                name = st.text_input("Nome do touro")
                code = st.text_input("Código")
                breed = st.selectbox("Raça", ["Holandês", "Jersey", "Girolando", "Gir Leiteiro"])

            with col2:
                category = st.text_input("Categoria (ex: Leite, Sólidos)")
                description = st.text_area("Descrição genética")

            bull_image_url = st.text_input("URL da foto do touro")

            if st.form_submit_button("💾 Salvar Touro"):
                if name and code:
                    new_bull = {
                        "id": int(datetime.now().timestamp() * 1000),
                        "name": name,
                        "code": code,
                        "breed": breed,
                        "category": category,
                        "description": description,
                        "bullImage": bull_image_url or "https://via.placeholder.com/300",
                        "daughters": []
                    }
                    st.session_state.bulls.insert(0, new_bull)
                    st.success("Touro adicionado com sucesso!")
                    st.rerun()
                else:
                    st.error("Preencha nome e código do touro")

    with tab3:
        st.markdown("## Importar Base em JSON")

        uploaded_file = st.file_uploader("Selecione um arquivo JSON", type="json")

        if uploaded_file:
            try:
                imported_data = json.load(uploaded_file)
                if isinstance(imported_data, list):
                    st.session_state.bulls = imported_data
                    st.success("Base importada com sucesso!")
                    st.rerun()
                else:
                    st.error("Arquivo JSON inválido. Deve ser uma lista de touros.")
            except Exception as e:
                st.error(f"Erro ao importar: {e}")

    with tab4:
        st.markdown("## Exportar Base")

        col1, col2, col3 = st.columns(3)

        with col1:
            if st.button("📥 Exportar Base Completa"):
                json_str = json.dumps(st.session_state.bulls, ensure_ascii=False, indent=2)
                st.download_button(
                    "Baixar JSON",
                    json_str,
                    "alta-gallery-dados.json",
                    "application/json"
                )

        with col2:
            if st.button("📊 Exportar como CSV"):
                bulls_df = pd.DataFrame([
                    {
                        "Nome": bull["name"],
                        "Código": bull["code"],
                        "Raça": bull["breed"],
                        "Categoria": bull["category"],
                        "Fotos": len(bull["daughters"])
                    }
                    for bull in st.session_state.bulls
                ])
                st.download_button(
                    "Baixar CSV",
                    bulls_df.to_csv(index=False),
                    "alta-gallery-dados.csv",
                    "text/csv"
                )

    with tab5:
        st.markdown("## Gerenciar Touros")

        if st.button("🔄 Resetar todos os dados"):
            if st.checkbox("Confirmar reset"):
                st.session_state.bulls = []
                st.success("Dados resetados!")
                st.rerun()

        st.markdown("### Touros cadastrados:")
        for bull in st.session_state.bulls:
            st.write(f"- **{bull['name']}** ({bull['code']}) - {len(bull['daughters'])} fotos")
