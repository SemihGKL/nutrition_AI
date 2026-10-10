package com.nutrition.backend.infrastructure.push;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrition.backend.domain.entity.PushSubscription;
import com.nutrition.backend.domain.exception.PushSubscriptionExpiredException;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.apache.http.HttpResponse;
import org.apache.http.StatusLine;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.security.KeyPairGenerator;
import java.security.SecureRandom;
import java.security.Security;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class WebPushNotificationAdapterTest {

    private static PushSubscription subscription;

    @BeforeAll
    static void validBrowserKeys() throws Exception {
        Security.addProvider(new BouncyCastleProvider());
        KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
        generator.initialize(new ECGenParameterSpec("secp256r1"));
        ECPublicKey publicKey = (ECPublicKey) generator.generateKeyPair().getPublic();
        byte[] point = new byte[65];
        point[0] = 0x04;
        copyUnsigned(publicKey.getW().getAffineX().toByteArray(), point, 1);
        copyUnsigned(publicKey.getW().getAffineY().toByteArray(), point, 33);
        byte[] auth = new byte[16];
        new SecureRandom().nextBytes(auth);
        Base64.Encoder b64 = Base64.getUrlEncoder().withoutPadding();
        subscription = new PushSubscription(1L, 1L, "https://push.example/device-1", b64.encodeToString(point), b64.encodeToString(auth));
    }

    private static void copyUnsigned(byte[] value, byte[] target, int offset) {
        int start = Math.max(0, value.length - 32);
        int length = value.length - start;
        System.arraycopy(value, start, target, offset + 32 - length, length);
    }

    private WebPushNotificationAdapter adapterReturning(int status) throws Exception {
        PushService pushService = mock(PushService.class);
        HttpResponse response = mock(HttpResponse.class);
        StatusLine statusLine = mock(StatusLine.class);
        when(statusLine.getStatusCode()).thenReturn(status);
        when(response.getStatusLine()).thenReturn(statusLine);
        when(pushService.send(any(Notification.class))).thenReturn(response);
        return new WebPushNotificationAdapter(pushService, new ObjectMapper());
    }

    @ParameterizedTest
    @ValueSource(ints = {200, 201})
    void should_accept_a_delivered_notification(int status) throws Exception {
        assertThatCode(() -> adapterReturning(status).send(subscription, "Titre", "Corps")).doesNotThrowAnyException();
    }

    @ParameterizedTest
    @ValueSource(ints = {404, 410})
    void should_report_an_expired_subscription_when_the_device_is_gone(int status) throws Exception {
        WebPushNotificationAdapter adapter = adapterReturning(status);

        assertThatThrownBy(() -> adapter.send(subscription, "Titre", "Corps"))
                .isInstanceOf(PushSubscriptionExpiredException.class);
    }

    @Test
    void should_fail_without_expiring_on_another_error() throws Exception {
        WebPushNotificationAdapter adapter = adapterReturning(500);

        assertThatThrownBy(() -> adapter.send(subscription, "Titre", "Corps"))
                .isInstanceOf(RuntimeException.class)
                .isNotInstanceOf(PushSubscriptionExpiredException.class);
    }
}
