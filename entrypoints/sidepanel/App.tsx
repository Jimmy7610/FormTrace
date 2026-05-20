import { useEffect } from 'react';
import FormTracePanel from '../../src/ui/FormTracePanel';

export default function App() {
  useEffect(() => {
    document.body.classList.add('sidepanel-mode');
  }, []);

  return <FormTracePanel isSidePanel={true} />;
}
