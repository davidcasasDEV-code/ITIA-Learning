"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../components/app-shell";
import { Badge, Btn, Card, Container, COLORS, SECTION_META, TextInput } from "../components/ui-kit";

const TABS = ["Resumen", "Usuarios", "Contenido"];

export default function AdminPage() {
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("Resumen");
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setMe(data);
        if (data?.user?.role !== "ADMIN") setForbidden(true);
      });
  }, []);

  if (forbidden) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Card style={{ padding: 28 }}>Esta sección es solo para administradores.</Card>
      </main>
    );
  }

  if (!me) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <p>Cargando…</p>
      </main>
    );
  }

  return (
    <AppShell me={me}>
      <Container style={{ padding: "28px 20px 60px" }}>
        <h1 style={{ marginBottom: 20 }}>Panel de Admin</h1>
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                border: "none",
                borderRadius: 9999,
                padding: "8px 18px",
                fontWeight: 800,
                cursor: "pointer",
                background: tab === t ? COLORS.blue : COLORS.surfaceMuted,
                color: tab === t ? "#fff" : COLORS.textMuted,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Resumen" && <SummaryTab />}
        {tab === "Usuarios" && <UsersTab />}
        {tab === "Contenido" && <ContentTab />}
      </Container>
    </AppShell>
  );
}

function SummaryTab() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch("/api/admin/summary", { credentials: "include" }).then((r) => r.json()).then(setSummary);
  }, []);

  if (!summary) return <p>Cargando…</p>;

  const kpis = [
    { label: "Usuarios totales", value: summary.totalUsers },
    { label: "En prueba (trial)", value: summary.trialUsers },
    { label: "Suscriptores activos", value: summary.activeSubscribers },
    { label: "Ingreso mensual estimado", value: `$${(summary.estimatedMonthlyRevenueCents / 100).toFixed(2)}` },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="itia-grid-1-mobile">
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <div style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: 700 }}>{kpi.label}</div>
          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{kpi.value}</div>
        </Card>
      ))}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    load();
  }, []);

  function load() {
    fetch("/api/admin/users", { credentials: "include" }).then((r) => r.json()).then(setUsers);
  }

  async function updateUser(id, patch) {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    load();
  }

  return (
    <Card style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", color: COLORS.textMuted }}>
            <th style={{ padding: 8 }}>Usuario</th>
            <th style={{ padding: 8 }}>Rol</th>
            <th style={{ padding: 8 }}>Suscripción</th>
            <th style={{ padding: 8 }}>Comentarios</th>
            <th style={{ padding: 8 }} />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
              <td style={{ padding: 8 }}>
                <div style={{ fontWeight: 700 }}>{user.displayName}</div>
                <div style={{ color: COLORS.textMuted }}>{user.publicHandle}</div>
              </td>
              <td style={{ padding: 8 }}>
                <select value={user.role} onChange={(e) => updateUser(user.id, { role: e.target.value })}>
                  <option value="USER">USER</option>
                  <option value="TEACHER">TEACHER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>
              <td style={{ padding: 8 }}>
                {user.subscription ? (
                  <Badge color={user.subscription.status === "TRIALING" ? COLORS.yellow : COLORS.green}>
                    {user.subscription.plan?.name || user.subscription.status}
                  </Badge>
                ) : (
                  <Badge color={COLORS.textLight}>Sin suscripción</Badge>
                )}
              </td>
              <td style={{ padding: 8 }}>
                {user.commentsBlocked ? <Badge color="#ef4444">Bloqueado</Badge> : "OK"}
              </td>
              <td style={{ padding: 8 }}>
                <Btn
                  size="sm"
                  variant="outline"
                  onClick={() => updateUser(user.id, { commentsBlocked: !user.commentsBlocked })}
                >
                  {user.commentsBlocked ? "Desbloquear" : "Bloquear comentarios"}
                </Btn>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

const SECTION_TYPES = ["DIALOGS", "VOCABULARY", "EXERCISES", "INTONATION", "PRONUNCIATION", "COMPREHENSION"];

function ContentTab() {
  const [levels, setLevels] = useState([]);
  const [unitId, setUnitId] = useState("");
  const [unit, setUnit] = useState(null);
  const [sectionType, setSectionType] = useState("VOCABULARY");

  useEffect(() => {
    fetch("/api/curriculum", { credentials: "include" }).then((r) => r.json()).then(setLevels);
  }, []);

  useEffect(() => {
    if (!unitId) return;
    loadUnit();
  }, [unitId]);

  function loadUnit() {
    fetch(`/api/units/${unitId}`, { credentials: "include" }).then((r) => r.json()).then(setUnit);
  }

  const section = unit?.sections.find((s) => s.type === sectionType);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }} className="itia-grid-1-mobile">
      <Card>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Unidades</div>
        <div style={{ display: "grid", gap: 14 }}>
          {levels.map((level) => (
            <div key={level.slug}>
              <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.textMuted, marginBottom: 4 }}>
                {level.name}
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                {level.units.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setUnitId(u.id)}
                    style={{
                      textAlign: "left",
                      border: "none",
                      borderRadius: 8,
                      padding: "6px 8px",
                      cursor: "pointer",
                      background: unitId === u.id ? COLORS.surfaceMuted : "transparent",
                      fontWeight: unitId === u.id ? 800 : 500,
                    }}
                  >
                    {u.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        {!unit && <p style={{ color: COLORS.textMuted }}>Elige una unidad para editar su contenido.</p>}
        {unit && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {SECTION_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSectionType(type)}
                  style={{
                    border: `2px solid ${SECTION_META[type].color}`,
                    background: sectionType === type ? SECTION_META[type].color : "transparent",
                    color: sectionType === type ? "#fff" : SECTION_META[type].color,
                    borderRadius: 9999,
                    padding: "6px 14px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {SECTION_META[type].label}
                </button>
              ))}
            </div>
            {section && <SectionEditor key={section.id} section={section} onChanged={loadUnit} />}
          </>
        )}
      </Card>
    </div>
  );
}

const FORM_FIELDS = {
  VOCABULARY: [
    { key: "term", label: "Palabra" },
    { key: "definition", label: "Definición" },
  ],
  DIALOGS: [
    { key: "speaker", label: "Quién habla" },
    { key: "line", label: "Línea" },
  ],
  INTONATION: [
    { key: "phrase", label: "Frase" },
    { key: "pattern", label: "Patrón (rising/falling)" },
  ],
  PRONUNCIATION: [
    { key: "word", label: "Palabra" },
    { key: "ipa", label: "IPA" },
  ],
};

const TYPE_ROUTE = {
  VOCABULARY: "vocabulary",
  DIALOGS: "dialog",
  INTONATION: "intonation",
  PRONUNCIATION: "pronunciation",
  EXERCISES: "exercise",
  COMPREHENSION: "comprehension",
};

const ITEM_LIST_KEY = {
  VOCABULARY: "vocabularyCards",
  DIALOGS: "dialogItems",
  INTONATION: "intonationItems",
  PRONUNCIATION: "pronunciationItems",
  EXERCISES: "exerciseItems",
  COMPREHENSION: "comprehensionItems",
};

function SectionEditor({ section, onChanged }) {
  const fields = FORM_FIELDS[section.type];
  const route = TYPE_ROUTE[section.type];
  const items = section[ITEM_LIST_KEY[section.type]] || [];
  const [form, setForm] = useState({});

  async function addItem() {
    await fetch(`/api/admin/content/${route}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId: section.id, order: items.length, ...form }),
    });
    setForm({});
    onChanged();
  }

  async function removeItem(id) {
    await fetch(`/api/admin/content/${route}/${id}`, { method: "DELETE", credentials: "include" });
    onChanged();
  }

  if (section.type === "EXERCISES" || section.type === "COMPREHENSION") {
    return (
      <p style={{ color: COLORS.textMuted }}>
        Los ejercicios y la comprensión auditiva se cargan como JSON (pregunta + opciones +
        respuesta correcta). Por ahora se agregan vía seed/script — la edición visual llega en
        una siguiente fase.
      </p>
    );
  }

  return (
    <div>
      <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 12px",
              background: COLORS.surfaceMuted,
              borderRadius: 10,
            }}
          >
            <span>
              {fields.map((f) => item[f.key]).join(" — ")}
            </span>
            <Btn size="sm" variant="danger" onClick={() => removeItem(item.id)}>
              Eliminar
            </Btn>
          </div>
        ))}
        {items.length === 0 && <p style={{ color: COLORS.textMuted }}>Sin elementos todavía.</p>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${fields.length}, 1fr) auto`, gap: 8 }}>
        {fields.map((f) => (
          <TextInput
            key={f.key}
            placeholder={f.label}
            value={form[f.key] || ""}
            onChange={(value) => setForm((prev) => ({ ...prev, [f.key]: value }))}
          />
        ))}
        <Btn onClick={addItem}>Agregar</Btn>
      </div>
    </div>
  );
}
