// SettingsPage - the organisation's rostering configuration, in three tabs.
// Managers and owners only; the route already enforces that.
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { QualificationsSection } from './qualifications/index.js';
import { ShiftTemplatesSection } from './shiftTemplates/index.js';
import { CoverageSection } from './coverage/index.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

const tabs = [
  { value: 'qualifications', label: 'Qualifications' },
  { value: 'templates', label: 'Shift templates' },
  { value: 'coverage', label: 'Coverage' },
];

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('qualifications');
  useDocumentTitle('Settings');

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Settings"
        description="The shifts you run, the skills they need, and how many people each one takes."
      />

      <div className="mt-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="mt-6">
        {activeTab === 'qualifications' && <QualificationsSection />}
        {activeTab === 'templates' && <ShiftTemplatesSection />}
        {activeTab === 'coverage' && <CoverageSection />}
      </div>
    </div>
  );
}

export default SettingsPage;
