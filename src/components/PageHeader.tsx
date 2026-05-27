type Props = {
  label?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function PageHeader({ label, title, description, children }: Props) {
  return (
    <header className="page-header">
      {label && <p className="page-header-label">{label}</p>}
      <h1 className="page-header-title">{title}</h1>
      {description && <p className="page-header-desc">{description}</p>}
      {children}
    </header>
  );
}
