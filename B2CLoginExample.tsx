import axios from 'axios';
import React from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import MsalPlugin, {
  IAuthenticationResult,
  IError,
  IPolicies,
  MsalUIBehavior,
} from 'react-native-msal-plugin';

const authority =
  'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const applicationId = '05d5517f-8a0b-496a-9d9c-3adba8cd52ee';
const policies = {
  signUpSignInPolicy: 'B2C_1_signup-signin-policy',
  passwordResetPolicy: 'B2C_1_password-reset-policy',
} as IPolicies;

const scopes = ['https://orgb7413eb8.crm5.dynamics.com/.default'] as string[];

interface IState {
  isLoggingIn: boolean;
  isLoggedin: boolean;
  authenticationResult: IAuthenticationResult;
  isRefreshingToken: boolean;
  datas: any;
}

export default class B2CLoginExample extends React.Component<any, IState> {
  private msalPlugin: MsalPlugin;

  constructor(props: any) {
    super(props);

    this.msalPlugin = new MsalPlugin(authority, applicationId, policies);

    this.state = {
      isLoggingIn: false,
      isLoggedin: false,
      isRefreshingToken: false,
      authenticationResult: {} as IAuthenticationResult,
      datas: [],
    };
  }

  componentDidMount = async () => {
    let tokenResult: any;
    try {
      tokenResult = await this.msalPlugin.acquireTokenAsync(scopes);
    } catch (error) {
      console.log(error);
    }
    const config = {
      headers: {
        Authorization: 'Bearer ' + tokenResult.accessToken,
        'OData-Version': '4.0',
        'OData-MaxVersion': '4.0',
        'Content-Type': 'application/json; charset=utf-8',
        Prefer:
          ' odata.include-annotations=OData.Community.Display.V1.FormattedValue',
      },,
    };
    axios
      .get(
        'https://orgb7413eb8.crm5.dynamics.com/api/data/v9.2/contacts?$select=fullname',
        config,
      )
      .then((response) => {
        this.setState({datas: response.data.value});
      })
      .catch((error) => {
        console.log(error.response);
      });
  };

  public renderLogin() {
    return (
      <TouchableOpacity onPress={this.handleLoginPress}>
        <Text style={styles.button}>Login with b2c</Text>
      </TouchableOpacity>
    );
  }

  public renderRefreshToken() {
    return this.state.isRefreshingToken ? (
      <ActivityIndicator />
    ) : (
      <TouchableOpacity style={{margin: 10}} onPress={this.handleTokenRefresh}>
        <Text style={styles.button}>Refresh Token</Text>
      </TouchableOpacity>
    );
  }

  public renderLogout() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Hi {this.state.authenticationResult.userInfo.name}!
        </Text>
        <Text style={styles.expiresOn}>
          Token Expires On {this.state.authenticationResult.expiresOn}
        </Text>
        {this.renderRefreshToken()}
        <TouchableOpacity onPress={this.handleLogoutPress}>
          <Text style={styles.button}>Logout</Text>
        </TouchableOpacity>
        <FlatList
          data={this.state.datas}
          keyExtractor={({id}, index) => id}
          renderItem={({item}) => <Text>{item.fullname}</Text>}
        />
        <Button title="Submit Data" onPress={this.submitData}></Button>
      </View>
    );
  }

  public render() {
    return (
      <View style={styles.container}>
        {this.state.isLoggingIn && <ActivityIndicator />}
        {this.state.isLoggedin &&
          !this.state.isLoggingIn &&
          this.renderLogout()}
        {!this.state.isLoggedin &&
          !this.state.isLoggingIn &&
          this.renderLogin()}
      </View>
    );
  }

  private isLoggingIn = (value: boolean): void => {
    this.setState({
      isLoggingIn: value,
    });
  };

  private submitData = () => {
    axios
      .post(
        'https://orgb7413eb8.crm5.dynamics.com/api/data/v9.2/cr547_customentity',
        {
          cr547_name: 'Cuong',
          cr547_fullname: 'Cuong',
        },
        {
          headers: {
            Authorization: `Bearer  ${this.state.authenticationResult.accessToken}`,
        'OData-Version': '4.0',
        'OData-MaxVersion': '4.0',
            'Content-Type': 'application/json; charset=utf-8',
            Prefer:
          ' odata.include-annotations=OData.Community.Display.V1.FormattedValue',
      },
        },
      )
      .then(function (response) {
        console.log(response);
      });
  };

  private refreshingToken = (value: boolean): void => {
    this.setState({
      isRefreshingToken: value,
    });
  };

  private handleTokenRefresh = async (): Promise<void> => {
    this.refreshingToken(true);

    try {
      const result = await this.msalPlugin.acquireTokenSilentAsync(
        scopes,
        this.state.authenticationResult.userInfo.userIdentifier,
        true,
      );

      this.setState({
        isRefreshingToken: false,
        isLoggedin: true,
        authenticationResult: result,
      });
    } catch (error) {
      this.refreshingToken(false);
    }
  };

  private handleLoginPress = async (): Promise<void> => {
    this.isLoggingIn(true);

    const extraQueryParameters: Record<string, string> = {
      myKeyOne: 'myKeyOneValue',
      myKeyTwo: 'myKeyTwoValue',
    };

    try {
      const result = await this.msalPlugin.acquireTokenAsync(
        scopes,
        extraQueryParameters,
        '',
        MsalUIBehavior.SELECT_ACCOUNT,
      );
      this.setState({
        isLoggingIn: false,
        isLoggedin: true,
        authenticationResult: result,
      });
    } catch (error) {
      console.log(error);
      this.isLoggingIn(false);
    }
  };

  private handleLogoutPress = () => {
    this.msalPlugin
      .tokenCacheDelete()
      .then(() => {
        this.setState({
          isLoggedin: false,
          authenticationResult: {} as IAuthenticationResult,
        });
      })
      .catch((error: IError) => {
        // tslint:disable-next-line:no-console
        console.log(error.message);
      });
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 20,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  expiresOn: {
    fontSize: 15,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
  },
});
