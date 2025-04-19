import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import store from './store/store';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';

ReactDOM.createRoot(document.getElementById('root')).render(
    // <React.StrictMode>
    <Provider store={store}>
        {/* <WasmProvider> */}
        <Toaster richColors position='top-right' closeButton expand/>
        <App />
        {/* </WasmProvider> */}
    </Provider>
    // </React.StrictMode>
);