package app.federico.traina;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import io.capawesome.capacitorjs.plugins.firebase.authentication.FirebaseAuthenticationPlugin;

public class MainActivity extends BridgeActivity {

    public void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        registerPlugin(FirebaseAuthenticationPlugin.class);

    }
}
